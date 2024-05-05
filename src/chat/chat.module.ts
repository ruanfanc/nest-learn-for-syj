import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { Chat } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Chat])],
  providers: [ChatGateway],
})
export class ChatModule {}
