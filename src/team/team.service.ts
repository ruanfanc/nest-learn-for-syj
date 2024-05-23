import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AddManager, ApplyTeam, JoinTeam } from './dto/team.dto';
import { AuthLevel, Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_IDENTITY, User } from 'src/user/entities/user.entity';
import { ChatService } from 'src/chat/chat.service';
import { ChatType } from 'src/chat/entities/chat.entity';

@Injectable()
export class TeamService {
  constructor(private chatService: ChatService) {}
  @InjectRepository(Team) private teamRepository: Repository<Team>;
  @InjectRepository(User) private userRepository: Repository<User>;

  async audit(joinTeam: JoinTeam, session) {
    const { groupId, userId, isPass } = joinTeam;
    const targetUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (targetUser.groupId) {
      throw new HttpException(
        {
          errorno: 24,
          errormsg: `改用户已加入其它团队，请联系其退出该团队后再申请`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const team = await this.teamRepository.findOne({
      where: { id: groupId },
    });
    this.testTeamAdmin(team, session.openid);

    if (isPass) {
      this.chatService.sendMessage({
        from: session.openid,
        to: userId,
        type: ChatType.AGREE_JOIN_TEAM_APPLY,
        agreeJoinTeamApplyInfo: {
          groupId: groupId,
          userId: userId,
        },
      });

      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ groupId })
        .where('id=:id', { id: userId })
        .execute();
    }
    return { success: true };
  }

  async apply(applyTeam: ApplyTeam) {
    const { userId, groupId } = applyTeam;

    const team = await this.userRepository.findOne({
      where: { id: groupId },
    });
    this.testTeam(team, applyTeam.groupId);
    // await this.teamApplyRepository.save({
    //   userId,
    //   groupId,
    //   createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    // });
    return { success: true };
  }

  async list(id: string) {
    if (!id) {
      return [];
    }
    console.log('decodeURIComponent(id): ', decodeURIComponent(id));
    const teams = await this.teamRepository
      .createQueryBuilder('team')
      .where('team.id LIKE :query', {
        query: `%${decodeURIComponent(id)}%`,
      })
      .getRawMany();

    const ids = teams.map((team) => team.team_id);
    return ids;
  }

  async createTeam(groupId: string, userInfo: User) {
    await this.teamRepository.save({
      id: groupId,
      admins: [
        {
          id: userInfo.id,
          level: userInfo.identity.includes(USER_IDENTITY.TEACHER)
            ? AuthLevel.TEACHER
            : AuthLevel.LEARDER,
        },
      ],
    });
  }

  async members(id: string) {
    const members = await this.userRepository.find({
      where: { groupId: id },
      select: ['id', 'groupId', 'nickName', 'avatarUrl'],
    });

    const team = await this.teamRepository.findOne({
      where: { id },
    });

    if (members.length > 0) {
      return members.map((item) => {
        return {
          ...item,
          adminLevel:
            team.admins?.find((admin) => admin.id === item.id).level || 4,
        };
      });
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
    const { id, userId, isAdd, level } = addManager;

    const team = await this.teamRepository.findOne({
      where: { id },
      select: ['admins'],
    });

    this.testTeam(team, id);
    this.testTeamAdminLevel(team, session.openid, 3);

    let editAdmins = team.admins;
    if (isAdd) {
      editAdmins = team.admins.find((item) => item.id === userId)
        ? team.admins
        : [...team.admins, { id: userId, level }];
    } else {
      editAdmins = editAdmins.filter((admin) => admin.id === userId);
    }

    await this.teamRepository
      .createQueryBuilder('team')
      .update(Team)
      .set({ admins: editAdmins })
      .where('team.id=:value', { value: id })
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
    this.testTeamAdminLevel(team, session.openid, 4);

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
          errorno: 444,
          errormsg: `未找到id为${id}的团队`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  testTeamAdmin(team: Team, userId: string) {
    if (!team.admins.find((item) => item.id === userId)) {
      throw new HttpException(
        {
          errorno: 111,
          errormsg: `该用户没有团队操作权限`,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  testTeamAdminLevel(team: Team, userId: string, targetLevel: number) {
    if (
      !team.admins.find(
        (item) => item.id === userId && item.level < targetLevel,
      )
    ) {
      throw new HttpException(
        {
          errorno: 111,
          errormsg: `该用户没有团队操作权限`,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
