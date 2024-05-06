import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatRoom, Message } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatRoom, User])],
  providers: [ChatGateway],
})
export class ChatModule {}
