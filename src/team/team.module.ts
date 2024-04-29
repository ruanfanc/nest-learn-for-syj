import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Team } from './entities/team.entity';
import { TeamApply } from './entities/teamApply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, User, TeamApply])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
