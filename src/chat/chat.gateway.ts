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
import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { joinStringSet } from 'src/common/utils';

@WebSocketGateway({
  namespace: 'younglaw',
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class ChatGateway {
  constructor(private sessionService: SessionService) {}

  @InjectRepository(Message) private messageRepository: Repository<Message>;
  @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>;
  @InjectRepository(User) private userRepository: Repository<User>;

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const query = client.handshake.query;
    client.data = { openid: query.id };
    this.sessionService.saveSession(query.id as string, client.id);
    this.newMessagesPreviewList(client);
    return { success: true };
  }

  handleDisconnect(client: Socket) {
    this.sessionService.deleteSession(client.data.openid);
  }

  emitClientSocket(userId: string) {
    const socketIdObj = this.sessionService.sessions.get(userId);
    if (socketIdObj) {
      return this.server.to(socketIdObj.id);
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

    if (chatRoomFinded) {
      const newMessage = await this.messageRepository.save({
        content,
        from: client.data.openid,
        to:
          chatRoomFinded.type === ChatType.GROUP
            ? `@${chatRoomId}`
            : chatRoomFinded.chatObjIds
                .split(',')
                .filter((item) => item !== client.data.openid)[0],
        chatRoomId,
      });

      await this.chatRoomRepository
        .createQueryBuilder()
        .update(ChatRoom)
        .set({
          messagesIds: joinStringSet(chatRoomFinded.messagesIds, newMessage.id),
        })
        .where('id=:id', { id: chatRoomId })
        .execute();

      chatRoomFinded.chatObjIds.split(',').forEach((item) => {
        this.emitClientSocket(item)?.emit('room-message-receive', newMessage);
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
    const chatRoom = await this.chatRoomRepository.save({
      chatObjIds: chatObjIds.join(','),
      caseId,
      chatRoomName: chatRoomName || chatObjIds.join('，'),
      type,
      teamHanldeCaseInfo,
      joinTeamApplyInfo,
      publicAgreeHandleInfo,
    });

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        chatGroups: () => `CONCAT(chatGroups, ',', '${chatRoom.id}')`,
      })
      .whereInIds(chatObjIds)
      .execute();

    return {
      chatRoomId: chatRoom.id,
    };
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
      .whereInIds(chatRoomFinded.messagesIds.split(','))
      .andWhere('NOT FIND_IN_SET(:value, message.chatObjsReaded)', {
        id: client.data.openid,
      })
      .orderBy('case.createTime', 'DESC')
      .getManyAndCount();

    return {
      total,
      caseId: chatRoomFinded.caseId,
      chatRoomName: chatRoomFinded.chatRoomName,
      messages: data,
    };
  }

  async newMessagesPreviewList(client: Socket) {
    const user = await this.userRepository.findOne({
      where: { id: client.data.openid },
      select: ['chatGroups'],
    });

    if (!user.chatGroups) {
      return {
        total: 0,
        chats: [],
      };
    }

    const [data, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where('FIND_IN_SET(message.chatRoomId, :chatRoomIds)', {
        chatRoomIds: user.chatGroups,
      })
      .andWhere('NOT FIND_IN_SET(:value, message.chatObjsReaded)', {
        id: client.data.openid,
      })
      .orderBy('case.createTime', 'DESC')
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
      .createQueryBuilder()
      .update(Message)
      .set({
        chatObjsReaded: () =>
          `CONCAT(chatObjsReaded, ',', '${client.data.openid}')`,
      })
      .whereInIds(messageIds)
      .execute();

    return {
      success: true,
    };
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
