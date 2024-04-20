import { Controller, Post, Body, Session } from '@nestjs/common';
import { TeamService } from './team.service';
import { JoinTeam } from './dto/team.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('/audit')
  audit(@Body() joinTeam: JoinTeam, @Session() session) {
    return this.teamService.audit(joinTeam, session);
  }
}
