import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Team } from './entities/team.entity';
import { ChatModule } from 'src/chat/chat.module';
import { ChatRoom } from 'src/chat/entities/chat.entity';

@Module({
  imports: [ChatModule, TypeOrmModule.forFeature([Team, User, ChatRoom])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
