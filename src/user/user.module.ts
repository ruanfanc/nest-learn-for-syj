import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { TeamModule } from 'src/team/team.module';
import { ChatModule } from 'src/chat/chat.module';
import { Team } from 'src/team/entities/team.entity';
import { ChatRoom } from 'src/chat/entities/chat.entity';

@Module({
  imports: [
    ChatModule,
    TeamModule,
    TypeOrmModule.forFeature([User, Team, ChatRoom]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule.forFeature([User])],
})
export class UserModule {}
