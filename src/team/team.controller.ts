import { Controller, Post, Body, Session, Get, Param } from '@nestjs/common';
import { TeamService } from './team.service';
import { JoinTeam, Members, AddManager, ApplyTeam } from './dto/team.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('/apply')
  apply(@Body() applyTeam: ApplyTeam) {
    return this.teamService.apply(applyTeam);
  }

  @Post('/audit')
  audit(@Body() joinTeam: JoinTeam, @Session() session) {
    return this.teamService.audit(joinTeam, session);
  }

  @Get('/list')
  list() {
    return this.teamService.list();
  }

  @Get('/members')
  members(@Param() members: Members) {
    return this.teamService.members(members.id);
  }

  @Post('/addManager')
  addManager(@Body() addManager: AddManager, @Session() session) {
    return this.teamService.addManager(addManager, session);
  }

  @Post('/addMember')
  addMember(@Body() addManager: AddManager, @Session() session) {
    return this.teamService.addMember(addManager, session);
  }
}
