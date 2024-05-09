import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import {
  ChangeChatDTO,
  CreateChatDto,
  CreateRoomDTO,
  GetChatDetailDTO,
  SendMessageDTO,
} from './dto/create-chat.dto';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionService } from 'src/session/session.service';
import { ChatRoom, ChatType, Message } from './entities/chat.entity';
import { HttpException, HttpStatus, Session, UseGuards } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { joinStringSet } from 'src/common/utils';
import { AuthGuard } from 'src/common/guard';
import sessionMemoryStore from 'src/sessionStore';
import { Case } from 'src/cases/entities/case.entity';
const Cookie = require('express-session/session/cookie.js');

const cookieSeriali = new Cookie();

@WebSocketGateway({
  namespace: 'younglaw',
  cors: { origin: 'localhost' },
  transports: ['polling', 'websocket', 'webtransport'],
})
export class ChatGateway {
  constructor(private sessionService: SessionService) {}

  @InjectRepository(Message) private messageRepository: Repository<Message>;
  @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>;
  @InjectRepository(User) private userRepository: Repository<User>;
  @InjectRepository(Case) private casesRepository: Repository<Case>;

  @WebSocketServer()
  server: Server;

  @UseGuards(AuthGuard)
  handleConnection(client: Socket, @Session() session) {
    const query = client.handshake.query;
    if (sessionMemoryStore['sessions']?.[query.cookie]) {
      console.log(`====== auth connect ${query.id} ======`);
      client.data = { openid: query.id };
      this.sessionService.saveSession(query.id as string, {
        sessionId: client.id,
      });

      // =================== Heartbeat Detection ====================
      const heartbeatInterval = setInterval(() => {
        const session = this.sessionService.findSession(query.id as string);

        if (session && session.isActive) {
          this.sessionService.saveSession(session.sessionId, {
            ...session,
            isActive: false,
          });
          client.emit('heartDetect', () => {
            this.sessionService.saveSession(session.sessionId, {
              ...session,
              isActive: true,
            });
          });
        } else {
          client.disconnect();
          this.sessionService.deleteSession(query.id as string);
          clearInterval(heartbeatInterval);
          console.log(`====== ${query.id} response to long; disconnect ======`);
        }
      }, 10000);
    } else {
      client.disconnect(true);
      console.log('====== auth fail disconnect ======');
    }
  }

  handleDisconnect(client: Socket) {
    clearInterval(
      this.sessionService.findSession(client.data.openid).heartbeatInterval,
    );
    this.sessionService.deleteSession(client.data.openid);
  }

  emitClientSocket(userId: string) {
    const socketIdObj = this.sessionService.sessions.get(userId);
    if (socketIdObj && socketIdObj.isActive) {
      return this.server.to(socketIdObj.sessionId);
    }
  }

  // @SubscribeMessage('changeChat')
  // changeChat(
  //   @MessageBody() changeChatDto: ChangeChatDTO,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   this.sessionService.saveChatId(client.data.openid, changeChatDto.chatId);
  //   console.log(this.sessionService.sessions);
  //   return { success: true };
  // }
  @SubscribeMessage('send')
  async send(
    @MessageBody() { chatRoomId, content }: SendMessageDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const chatRoomFinded = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    const fromUser = await this.userRepository.findOne({
      where: { id: client.data.openid },
      select: ['id', 'avatarUrl', 'nickName'],
    });

    if (chatRoomFinded && fromUser) {
      const newMessage = await this.messageRepository.save({
        content,
        from: fromUser.id,
        to:
          chatRoomFinded.type === ChatType.GROUP
            ? `@${chatRoomId}`
            : chatRoomFinded.chatObjIds
                .split(',')
                .filter((item) => item !== client.data.openid)[0],
        chatRoomId,
        nickName: fromUser.nickName,
        avatarUrl: fromUser.avatarUrl,
      });

      await this.chatRoomRepository
        .createQueryBuilder()
        .update(ChatRoom)
        .set({
          messagesIds: joinStringSet(chatRoomFinded.messagesIds, newMessage.id),
        })
        .where('id=:id', { id: chatRoomId })
        .execute();

      // 群发
      chatRoomFinded.chatObjIds.split(',').forEach((item) => {
        this.emitClientSocket(item)?.emit('room-message-receive', {
          [chatRoomId]: newMessage,
        });
      });
    }
  }

  @SubscribeMessage('createRoom')
  async createRoom(
    @MessageBody()
    {
      chatObjIds,
      chatRoomName,
      caseId,
      type = ChatType.NORMAL,
      teamHanldeCaseInfo,
      joinTeamApplyInfo,
      publicAgreeHandleInfo,
    }: CreateRoomDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const chatRoomFinded = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .where('chatRoom.type=:type', { type: ChatType.NORMAL })
      .andWhere(
        'FIND_IN_SET(:id1, chatRoom.chatObjIds) AND FIND_IN_SET(:id2, chatRoom.chatObjIds)',
        {
          id1: chatObjIds[0],
          id2: chatObjIds[1],
        },
      )
      .getOne();

    if (chatRoomFinded) {
      return this.emitClientSocket(client.data.openid)?.emit('createRoom', {
        chatRoomId: chatRoomFinded.id,
      });
    }

    const users = await this.userRepository
      .createQueryBuilder()
      .whereInIds(chatObjIds)
      .getMany();

    let caseDetail: Case;

    if (caseId) {
      caseDetail = await this.casesRepository.findOne({
        where: { id: caseId },
        select: ['title'],
      });
    }

    console.log(users, 'users');

    const chatRoom = await this.chatRoomRepository.save({
      chatObjIds: chatObjIds.join(','),
      caseId,
      chatRoomName:
        chatRoomName ||
        caseDetail.title ||
        users.map((item) => item.nickName).join('，'),
      type,
      teamHanldeCaseInfo,
      joinTeamApplyInfo,
      publicAgreeHandleInfo,
      chatObjAvatarUrl: users.map((item) => item.avatarUrl),
    } as ChatRoom);

    await this.userRepository
      .createQueryBuilder('user')
      .update(User)
      .set({
        chatGroups: () => joinStringSet('user.chatGroups', chatRoom.id),
      })
      .whereInIds(chatObjIds)
      .execute();

    return this.emitClientSocket(client.data.openid)?.emit('createRoom', {
      chatRoomId: chatRoom.id,
    });
  }

  @SubscribeMessage('detail')
  async detail(
    @MessageBody() { chatRoomId }: GetChatDetailDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const chatRoomFinded = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    const [data, total] = await this.messageRepository
      .createQueryBuilder('message')
      .whereInIds(chatRoomFinded.messagesIds?.split(',') || [])
      .andWhere('NOT FIND_IN_SET(:value, message.chatObjsReaded)', {
        value: client.data.openid,
      })
      .orderBy('message.createTime', 'DESC')
      .getManyAndCount();

    this.emitClientSocket(client.data.openid)?.emit('detail', {
      ...chatRoomFinded,
      total,
      caseId: chatRoomFinded.caseId,
      chatRoomName: chatRoomFinded.chatRoomName,
      messages: data,
    });
  }

  async newMessagesPreviewList(client: Socket) {
    const user = await this.userRepository.findOne({
      where: { id: client.data.openid },
      select: ['chatGroups'],
    });

    if (!user?.chatGroups) {
      return this.emitClientSocket(client.data.openid)?.emit(
        'newMessagesPreviewList',
        {
          total: 0,
          chats: [],
        },
      );
    }

    const [data, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where('FIND_IN_SET(message.chatRoomId, :chatRoomIds)', {
        chatRoomIds: user?.chatGroups,
      })
      .andWhere('NOT FIND_IN_SET(:value, message.chatObjsReaded)', {
        id: client.data.openid,
      })
      .orderBy('message.createTime', 'DESC')
      .getManyAndCount();

    const chatMap = new Map<number, Message[]>();
    const chatRoomMap = new Map<number, ChatRoom>();

    data.forEach((item) => {
      const chatMsgs = chatMap.get(item.chatRoomId) || [];

      chatMap.set(item.chatRoomId, [...chatMsgs, item]);
    });

    (
      await this.chatRoomRepository
        .createQueryBuilder()
        .whereInIds(chatMap.keys())
        .getMany()
    ).forEach((item) => {
      chatRoomMap.set(item.id, item);
    });

    this.emitClientSocket(client.data.openid)?.emit('newMessagesPreviewList', {
      total,
      chats: Array.from(chatMap.entries()).map(([chatId, messages]) => {
        const chatRoom = chatRoomMap.get(chatId);

        return {
          ...chatRoom,
          unReadNum: messages.length,
          messagePreview: messages?.[0],
          meesageTime: messages?.[0].createTime,
        };
      }),
    });
  }

  @SubscribeMessage('read')
  async readMessage(
    @MessageBody() { messageIds }: { messageIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messageRepository
      .createQueryBuilder('message')
      .update(Message)
      .set({
        chatObjsReaded: () =>
          joinStringSet('message.chatObjsReaded', client.data.openid),
      })
      .whereInIds(messageIds)
      .execute();

    return {
      success: true,
    };
  }

  async getSimpleUserInfoSet(ids: string[]) {
    const userMap = new Map<string, User>();

    (
      await this.userRepository
        .createQueryBuilder('user')
        .whereInIds(ids)
        .select(['id', 'avatarUrl', 'nickName'])
        .getMany()
    ).forEach((element) => {
      userMap.set(element.id, element);
    });

    return userMap;
  }

  notFoundRoom() {
    throw new HttpException(
      {
        errorno: 13,
        errormsg: `未找到该房间名`,
        data: {},
      },
      HttpStatus.OK,
    );
  }
}
