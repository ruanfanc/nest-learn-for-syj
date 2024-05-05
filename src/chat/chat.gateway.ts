import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ChangeChatDTO, CreateChatDto } from './dto/create-chat.dto';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { SessionService } from 'src/session/session.service';

@WebSocketGateway({
  namespace: 'younglaw',
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class ChatGateway {
  constructor(private sessionService: SessionService) {}

  @InjectRepository(Chat) private chatRepository: Repository<Chat>;

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

  @SubscribeMessage('changeChat')
  changeChat(
    @MessageBody() changeChatDto: ChangeChatDTO,
    @ConnectedSocket() client: Socket,
  ) {
    this.sessionService.saveChatId(client.data.openid, changeChatDto.chatId);
    console.log(this.sessionService.sessions);
    return { success: true };
  }

  @SubscribeMessage('send')
  connection(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(createChatDto);
  }
}
