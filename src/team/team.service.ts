import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { JoinTeam } from './dto/team.dto';

@Injectable()
export class TeamService {
  @InjectRepository(User)
  private userRepository: Repository<User>;

  audit(joinTeam: JoinTeam, session) {
    if (joinTeam.pass) {
      this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ groupId: joinTeam.id })
        .where('openid=:openid', { openid: session.openid })
        .execute();
    }
  }
}
