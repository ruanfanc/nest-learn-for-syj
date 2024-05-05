import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatRoom, Message } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatRoom])],
  providers: [ChatGateway],
})
export class ChatModule {}
