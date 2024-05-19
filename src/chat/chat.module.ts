import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatRoom, Message } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Case } from 'src/cases/entities/case.entity';
import { ChatService } from './chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatRoom, User, Case])],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
