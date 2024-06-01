import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  AddManager,
  AddMember,
  ApplyTeam,
  JoinTeam,
  PreviewlistDto,
} from './dto/team.dto';
import { AuthLevel, Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_IDENTITY, User } from 'src/user/entities/user.entity';
import { ChatService } from 'src/chat/chat.service';
import { ChatRoom, ChatType } from 'src/chat/entities/chat.entity';

@Injectable()
export class TeamService implements OnModuleInit {
  constructor(private chatService: ChatService) {}
  @InjectRepository(Team) private teamRepository: Repository<Team>;
  @InjectRepository(User) private userRepository: Repository<User>;
  @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>;

  async onModuleInit() {
    // const teams = await this.teamRepository.createQueryBuilder().getMany();
    // teams.forEach(async (team) => {
    //   const users = await this.userRepository
    //     .createQueryBuilder('user')
    //     .where(`user.groupId = :groupId`, {
    //       groupId: team.id,
    //     })
    //     .getMany();
    //   await this.teamRepository
    //     .createQueryBuilder('team')
    //     .update(Team)
    //     .set({
    //       admins: users.map((item) => ({
    //         id: item.id,
    //         level: item.identity.includes(USER_IDENTITY.TEACHER)
    //           ? AuthLevel.TEACHER
    //           : AuthLevel.MANAGER,
    //       })),
    //     })
    //     .where('team.id=:value', { value: team.id })
    //     .execute();
    // });
  }

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

      this.joinTeam({ groupId }, targetUser);
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

    const teams = await this.teamRepository
      .createQueryBuilder('team')
      .where('team.id LIKE :query', {
        query: `%${decodeURIComponent(id)}%`,
      })
      .take(10)
      .getRawMany();

    const ids = teams.map((team) => team.team_id);
    return ids;
  }

  async createTeam(
    {
      groupId,
      introduction,
      avatarUrl,
    }: {
      groupId: string;
      introduction?: string;
      avatarUrl?: string;
    },
    userInfo: User,
  ) {
    const team = this.teamRepository.findOne({
      where: { id: groupId },
    });

    if (team) {
      if (!avatarUrl) {
        return this.lackOfGroupAvatarUrl();
      } else {
        await this.teamRepository
          .createQueryBuilder('team')
          .update(Team)
          .set({
            introduction,
            avatarUrl,
          })
          .where('team.id=:id', { id: groupId })
          .execute();
      }
    }

    await this.teamRepository.save({
      id: groupId,
      admins: [
        {
          id: userInfo.id,
          level: AuthLevel.TEACHER,
        },
      ],
      hasTeacher: !!userInfo.identity?.includes(USER_IDENTITY.TEACHER),
      introduction,
      avatarUrl,
    });
  }

  async exitTeam(userInfo: User) {
    const originTeam = await this.teamRepository.findOne({
      where: { id: userInfo.groupId },
    });

    const isCreater =
      originTeam.admins.find((item) => item.id === userInfo.id)?.level ===
      AuthLevel.TEACHER;

    if (isCreater) {
      const teamMates = await this.userRepository
        .createQueryBuilder('user')
        .where('user.groupId = :value', {
          value: userInfo.groupId,
        })
        .getMany();

      await Promise.allSettled(
        teamMates.map(
          (item) =>
            new Promise<void>((resolve) => {
              {
                if (item.groupId !== userInfo.groupId) {
                  return this.exitTeam(item).finally(() => {
                    resolve();
                  });
                }
                return resolve();
              }
            }),
        ),
      );
    }

    const curChatGroups = userInfo.chatGroups.split(',');

    const chatGroups = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .where(`chatRoom.type = 5`)
      .whereInIds(curChatGroups)
      .getMany();

    chatGroups.forEach((chat) => {
      this.chatRoomRepository
        .createQueryBuilder()
        .update(ChatRoom)
        .set({
          chatObjIds: chat.chatObjIds
            .split(',')
            .filter((item) => item !== userInfo.id)
            .join(','),
        })
        .where('id=:id', { id: chat.id })
        .execute();
    });

    const chatGroupsSet = new Set(chatGroups.map((item) => item.id));

    if (originTeam) {
      await this.teamRepository
        .createQueryBuilder('team')
        .update(Team)
        .set({
          admins: originTeam.admins.filter((item) => item.id !== userInfo.id),
        })
        .where('team.id=:value', { value: userInfo.groupId })
        .execute();
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        groupId: null,
        chatGroups: curChatGroups
          .filter((item) => !chatGroupsSet.has(Number(item)))
          .join(','),
      })
      .where('id=:id', { id: userInfo.id })
      .execute();

    if (isCreater) {
      this.teamRepository
        .delete({
          id: userInfo.groupId,
        })
        .then((res) => {
          console.log('delete team', userInfo.groupId, res.raw);
        });
    }
  }

  async joinTeam({ groupId }: { groupId: string }, userInfo: User) {
    if (userInfo.identity.includes(USER_IDENTITY.TEACHER)) {
      await this.teamRepository
        .createQueryBuilder('team')
        .update(Team)
        .set({
          hasTeacher: true,
        })
        .where('team.id=:value', { value: groupId })
        .execute();
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ groupId })
      .where('id=:id', { id: userInfo.id })
      .execute();
  }

  async members(id: string) {
    const members = await this.userRepository.find({
      where: { groupId: id },
      select: ['id', 'groupId', 'nickName', 'avatarUrl'],
    });

    const team = await this.teamRepository.findOne({
      where: { id },
    });

    if (members.length > 0 && team) {
      return members.map((item) => {
        return {
          ...item,
          adminLevel:
            team.admins?.find((admin) => admin.id === item.id)?.level || 4,
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
    const { id, userIds, isAdd, level } = addManager;
    const userIdSet = new Set(userIds);

    const team = await this.teamRepository.findOne({
      where: { id },
      select: ['admins'],
    });

    this.testTeam(team, id);
    this.testTeamAdminLevel(team, session.openid, 3);

    let editAdmins = team.admins;
    const adminMap = new Map();

    editAdmins.forEach((item) => {
      adminMap.set(item.id, item);
    });
    if (isAdd) {
      userIdSet.forEach((userId) => {
        adminMap.set(userId, { id: userId, level });
      });
      editAdmins = Array.from(adminMap.values());
    } else {
      userIdSet.forEach((userId) => {
        if (adminMap.has(userId)) {
          adminMap.delete(userId);
        }
      });
      editAdmins = Array.from(adminMap.values());
    }

    await this.teamRepository
      .createQueryBuilder('team')
      .update(Team)
      .set({ admins: editAdmins })
      .where('team.id=:value', { value: id })
      .execute();

    return { success: true };
  }

  async addMember(addManager: AddMember, session) {
    const { id, userIds, isAdd } = addManager;
    const userIdSet = new Map<string, User>();

    const team = await this.teamRepository.findOne({
      where: { id },
      select: ['admins'],
    });

    this.testTeam(team, id);
    this.testTeamAdminLevel(team, session.openid, 4);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .whereInIds(userIds)
      .getMany();

    users.forEach((item) => {
      userIdSet.set(item.id, item);
    });

    if (!isAdd && users.find((user) => user.groupId !== id)) {
      throw new HttpException(
        {
          errorno: 1,
          errormsg: `用户未加入团队或者团队id不是${id}`,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const adminMap = new Map();

    team.admins.forEach((item) => {
      adminMap.set(item.id, item);
    });

    if (!isAdd) {
      // 清除管理员权限
      const editAdmins = team.admins.filter(
        (admin) => !userIdSet.has(admin.id),
      );

      await this.teamRepository
        .createQueryBuilder('team')
        .update(Team)
        .set({ admins: editAdmins })
        .where('team.id = :value', { value: id })
        .execute();

      // 删除所有群聊聊天房
      const chatRoomsMap = new Map<number, ChatRoom>();
      const allChatRooms = await this.chatRoomRepository
        .createQueryBuilder('chatRoom')
        .where(`type = ${ChatType.GROUP}`)
        .getMany();

      allChatRooms.filter((chatRoom) => {
        const chatRoomChatObjIds = new Set(chatRoom.chatObjIds.split(','));
        if (userIds.find((user) => chatRoomChatObjIds.has(user))) {
          chatRoomsMap.set(chatRoom.id, chatRoom);
          return true;
        }

        return false;
      });

      chatRoomsMap.forEach((chatRoom) => {
        const updatedChatObjIds = chatRoom.chatObjIds
          .split(',')
          .filter((id) => !userIdSet.has(id))
          .join(',');

        this.chatRoomRepository
          .createQueryBuilder('chatRoom')
          .update(chatRoom)
          .set({
            chatObjIds: updatedChatObjIds,
          })
          .where('chatRoom.id = :value', { value: chatRoom.id });
      });

      userIds.forEach((userId) => {
        const user = userIdSet.get(userId);
        const chatGroupsSet = new Set(user.chatGroups.split(','));

        chatGroupsSet.forEach((item) => {
          if (chatRoomsMap.has(Number(item))) {
            chatGroupsSet.delete(item);
          }
        });

        const newChatGroups = Array.from(chatGroupsSet);

        // 取消成员
        this.userRepository
          .createQueryBuilder('user')
          .update(User)
          .set({
            groupId: null,
            chatGroups: newChatGroups.join(',') + ',',
          })
          .where('user.id= :userId', { userId })
          .execute();
      });
    } else {
      userIds.forEach((userId) => {
        this.userRepository
          .createQueryBuilder()
          .update(User)
          .set({
            groupId: id,
          })
          .where('user.id= :userId', { userId })
          .execute();
      });
    }

    return { success: true };
  }

  async detail(id: string, session: { userInfo: User }) {
    const teamFinded = await this.teamRepository.findOne({
      where: { id },
    });

    return {
      detail: {
        ...teamFinded,
      },
    };
  }

  async findAll(
    { pageNo, pageSize, groupId }: PreviewlistDto,
    session: { userInfo: User },
  ) {
    const skip = (pageNo - 1) * pageSize;
    let query = this.teamRepository.createQueryBuilder('team');

    if (groupId) {
      query = query.where(`team.id = ${groupId}`);
    }

    const [data, total] = await this.teamRepository
      .createQueryBuilder('team')
      .orderBy('team.completedCaseCount', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      data,
      total,
    };
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

  lackOfGroupAvatarUrl() {
    throw new HttpException(
      {
        errorno: 655,
        errormsg: `缺少群头像`,
      },
      HttpStatus.OK,
    );
  }
}
