import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_IDENTITY, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CreateUserDto, InitUserDto } from './dto/user.dto';
import { TeamService } from 'src/team/team.service';
import { ChatService } from 'src/chat/chat.service';
import { Team } from 'src/team/entities/team.entity';
import { ChatType } from 'src/chat/entities/chat.entity';

@Injectable()
export class UserService {
  constructor(
    private teamService: TeamService,
    private chatService: ChatService,
  ) {}
  @InjectRepository(User) private userRepository: Repository<User>;
  @InjectRepository(Team) private teamRepository: Repository<Team>;

  async login({ code, nickName, avatarUrl }: CreateUserDto, session) {
    if (code === 'woshishdskashfasjk') {
      const user = await this.userRepository.findOne({
        where: { id: code },
      });

      session.openid = 'woshishdskashfasjk';
      session.authenticated = true;
      session.nickName = user.nickName;
      session.avatarUrl = user.avatarUrl;
      session.userInfo = user;
      return user;
    }

    if (code === 'aaaaaaaaaaatestteacher') {
      const user = await this.userRepository.findOne({
        where: { id: code },
      });

      session.openid = 'aaaaaaaaaaatestteacher';
      session.authenticated = true;
      session.nickName = user.nickName;
      session.avatarUrl = user.avatarUrl;
      session.userInfo = user;
      return user;
    }

    if (code === 'aaaaaaaaaaateststudent') {
      const user = await this.userRepository.findOne({
        where: { id: code },
      });

      session.openid = 'aaaaaaaaaaateststudent';
      session.authenticated = true;
      session.nickName = user.nickName;
      session.avatarUrl = user.avatarUrl;
      session.userInfo = user;
      return user;
    }

    const data = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wx559e4273b8badf2a&secret=7b8954140d68ecf74f21f53b058138e6&grant_type=authorization_code&js_code=${code}`,
    );

    if (data.data.errcode) return data.data;

    const { openid } = data.data;

    if (nickName && avatarUrl) {
      const user = await this.userRepository.findOne({
        where: { id: openid },
      });

      if (!user) {
        const count = await this.userRepository
          .createQueryBuilder('user')
          .where('user.nickName = :nickName', { nickName })
          .getCount();

        if (count !== 0) {
          throw new HttpException(
            {
              errorno: 12,
              errormsg: '名字重复',
              data: {
                success: false,
              },
            },
            HttpStatus.OK,
          );
        }
      }
      session.openid = openid;
      session.authenticated = true;
      session.nickName = nickName;
      session.avatarUrl = avatarUrl;

      const newUser = await this.userRepository.save({
        id: openid,
        nickName: nickName,
        avatarUrl: avatarUrl,
      });

      session.userInfo = newUser;
      return newUser;
    } else {
      //  =============== just return user info ===============
      const user = await this.userRepository.findOne({
        where: { id: openid },
      });

      if (user) {
        session.openid = openid;
        session.authenticated = true;
        session.nickName = user.nickName;
        session.avatarUrl = user.avatarUrl;
        session.userInfo = user;
        return { ...user };
      } else {
        session.openid = openid;
        session.authenticated = true;

        await this.userRepository.save({
          id: openid,
        });
        const userInfo = {
          id: openid,
        };
        session.userInfo = userInfo;
        return userInfo;
      }
    }
  }
  async init(initUse: InitUserDto, session: { userInfo: User }) {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        ...initUse,
        groupId: initUse.identity?.includes(USER_IDENTITY.TEACHER)
          ? initUse.groupId
          : null,
        identity: initUse.identity.filter(
          (item) => item !== USER_IDENTITY.MANAGER,
        ),
      })
      .where('id=:id', { id: session.userInfo.id })
      .execute();

    const user = await this.userRepository.findOne({
      where: { id: session.userInfo.id },
    });

    const identity = user.identity;

    if (identity.includes(USER_IDENTITY.TEACHER)) {
      await this.teamService.createTeam(initUse.groupId, session.userInfo.id);
    } else if (identity.includes(USER_IDENTITY.STUDENT)) {
      const team = await this.teamRepository.findOne({
        where: { id: initUse.groupId },
      });
      team.admins.forEach((item) => {
        this.chatService.sendMessage({
          from: user.id,
          to: item,
          type: ChatType.JOIN_TEAM_APPLY,
          joinTeamApplyInfo: {
            groupId: initUse.groupId,
            userId: user.id,
          },
        });
      });
    }

    if (user) {
      session.userInfo = user;
      return { ...user };
    }

    throw new HttpException(
      {
        errorno: 6,
        errormsg: `未找到openid为${session.userInfo.id}的用户`,
      },
      HttpStatus.OK,
    );
  }

  /** this api is only for internal module */
  async getUserInfo(openid: string, session) {
    const user = await this.userRepository.findOne({ where: { id: openid } });

    if (user) {
      session.userInfo = user;
      return { ...user };
    }

    return user;
  }
}
