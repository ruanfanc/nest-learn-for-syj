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

@WebSocketGateway({
  namespace: 'younglaw',
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class ChatGateway {
  constructor(private sessionService: SessionService) {}

  @InjectRepository(Message) private messageRepository: Repository<Message>;
  @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>;

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const query = client.handshake.query;
    client.data = { openid: query.id };
    this.sessionService.saveSession(query.id as string, client.id);
    return { success: true };
  }

  handleDisconnect(client: Socket) {
    this.sessionService.deleteSession(client.data.openid);
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
            : chatRoomFinded.chatObjIds.filter(
                (item) => item !== client.data.openid,
              )[0],
      });

      this.chatRoomRepository
        .createQueryBuilder()
        .update(ChatRoom)
        .set({
          messagesIds: [...(chatRoomFinded.messagesIds || []), newMessage.id],
        })
        .where('id=:id', { id: chatRoomId })
        .execute();

      chatRoomFinded.chatObjIds.forEach((item) => {
        const socketIdObj = this.sessionService.sessions.get(item);
        if (socketIdObj) {
          this.server
            .to(socketIdObj.id)
            .emit('room-message-receive', newMessage);
        }
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
      chatObjIds,
      caseId,
      chatRoomName: chatRoomName || chatObjIds.join('，'),
      type,
      teamHanldeCaseInfo,
      joinTeamApplyInfo,
      publicAgreeHandleInfo,
    });

    return {
      chatRoomId: chatRoom.id,
    };
  }

  @SubscribeMessage('detail')
  async detail(
    @MessageBody() { chatRoomId, pageNo, pageSize }: GetChatDetailDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const chatRoomFinded = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    const skip = (pageNo - 1) * pageSize;

    const [data, total] = await this.messageRepository
      .createQueryBuilder()
      .whereInIds(chatRoomFinded.messagesIds)
      .orderBy('case.createTime', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      total,
      caseId: chatRoomFinded.caseId,
      chatRoomName: chatRoomFinded.chatRoomName,
      messages: data,
    };
  }

  @SubscribeMessage('previewList')
  async previewList(
    @MessageBody() { chatRoomId, pageNo, pageSize }: GetChatDetailDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const chatGroupRoomFinded = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .where('chatRoom.type=:type', { type: ChatType.GROUP })
      .andWhere('JSON_CONTAINS(chatRoom.chatObjIds, :value)', {
        value: client.data.openid,
      })
      .getMany();

    const skip = (pageNo - 1) * pageSize;

    const [data, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.to=:id OR message.to IN (:...chatRoomIds)', {
        id: client.data.openid,
        chatRoomIds: chatGroupRoomFinded.map((item) => `@${item.id}`),
      })
      .where('NOT JSON_CONTAINS(chatRoom.chatObjsReaded, :value)', {
        id: client.data.openid,
      })
      .orderBy('case.createTime', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    const chatMap = new Map<string, Message[]>();
    const chatRoomMap = new Map<number, ChatRoom>();

    chatGroupRoomFinded.forEach((item) => {
      chatRoomMap.set(item.id, item);
    });

    data.forEach((item) => {
      const chatMsgs = chatMap.get(item.to) || [];

      chatMap.set(item.to, [...chatMsgs, item]);
    });

    return {
      total,
      chats: Array.from(chatMap.entries()).map(([chatId, messages]) => {
        const chatRoom = chatRoomMap.get(Number(chatId.slice(1)));

        return {
          ...chatRoom,
          unReadNum: messages.length,
          messagePreview: messages?.[0],
          meesageTime: messages?.[0].createTime,
        };
      }),
    };
  }

  @SubscribeMessage('read')
  async readMessage(
    @MessageBody() { messageIds }: { messageIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const messsagesFinded = await this.messageRepository
      .createQueryBuilder()
      .whereInIds(messageIds)
      .getMany();

    await new Promise<void>((resolve) => {
      messsagesFinded.forEach((element, index) => {
        this.messageRepository
          .createQueryBuilder()
          .update(Message)
          .set({
            chatObjsReaded: [
              ...(element.chatObjsReaded || []),
              client.data.openid,
            ],
          })
          .where('id=:id', { id: element.id })
          .execute()
          .catch((err) => {
            throw new HttpException(
              {
                errorno: 14,
                errormsg: JSON.stringify(err),
                data: {
                  success: false,
                },
              },
              HttpStatus.OK,
            );
          })
          .finally(() => {
            if (index === messsagesFinded.length) {
              resolve();
            }
          });
      });
    });

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
