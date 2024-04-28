import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AddManager, JoinTeam } from './dto/team.dto';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class TeamService {
  @InjectRepository(Team) private teamRepository: Repository<Team>;
  @InjectRepository(User) private userRepository: Repository<User>;

  audit(joinTeam: JoinTeam, session) {}

  async list() {
    const teams = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .getRawMany();
    const ids = teams.map((user) => user.id);
    return ids;
  }

  async createTeam(groupId: string, userId) {
    await this.teamRepository.save({ id: groupId, admins: [userId] });
  }

  async members(id: string) {
    const members = await this.userRepository.find({
      where: { groupId: id },
      select: ['id', 'groupId', 'nickName', 'avatarUrl'],
    });
    if (members.length > 0) {
      return members;
    } else {
      throw new HttpException(
        {
          errorno: 4,
          errormsg: `未找到id为${id}的团队的成员`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async addManager(addManager: AddManager, session) {
    const { id, userId, isAdd } = addManager;

    const team = await this.teamRepository.findOne({
      where: { id },
      select: ['admins'],
    });

    this.testTeam(team, id);
    this.testTeamAdmin(team, session.openid);

    let editAdmins = team.admins;
    if (isAdd) {
      editAdmins = team.admins.includes(userId)
        ? team.admins
        : [...team.admins, userId];
    } else {
      editAdmins = editAdmins.filter((admin) => admin !== userId);
    }

    await this.teamRepository
      .createQueryBuilder()
      .update(Team)
      .set({ admins: editAdmins })
      .where('id=:id', { id })
      .execute();

    return { success: true };
  }

  async addMember(addManager: AddManager, session) {
    const { id, userId, isAdd } = addManager;

    const team = await this.teamRepository.findOne({
      where: { id },
      select: ['admins'],
    });

    this.testTeam(team, id);
    this.testTeamAdmin(team, session.openid);

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!isAdd && user.groupId !== id) {
      throw new HttpException(
        {
          errorno: 1,
          errormsg: `用户未加入团队或者团队id不是${id}`,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ groupId: isAdd ? id : null })
      .where('id=:id', { userId })
      .execute();

    return { success: true };
  }

  testTeam(team, id) {
    if (!team) {
      throw new HttpException(
        {
          errorno: 4,
          errormsg: `未找到id为${id}的团队`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  testTeamAdmin(team: Team, userId: string) {
    if (!team.admins.includes(userId)) {
      throw new HttpException(
        {
          errorno: 1,
          errormsg: `该用户没有团队操作权限`,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
