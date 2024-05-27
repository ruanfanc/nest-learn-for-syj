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
    const team = await this.teamRepository.findOne({
      where: { id: initUse.groupId },
    });
    if (initUse.groupId) {
      if (initUse.isCreateTeam) {
        if (!initUse.groupAvatarUrl) {
          return this.lackOfGroupAvatarUrl();
        }

        if (initUse.isCreateTeam && team) {
          return this.groupHasExist();
        }
      } else {
        if (!team) {
          return this.groupNotFound();
        }
      }
    }

    if (initUse.groupId) {
      if (!initUse.isCreateTeam) {
        // 加入群聊
        team.admins.forEach((item) => {
          this.chatService.sendMessage({
            from: session.userInfo.id,
            to: item.id,
            type: ChatType.JOIN_TEAM_APPLY,
            joinTeamApplyInfo: {
              groupId: initUse.groupId,
              userId: session.userInfo.id,
            },
          });
        });
      } else {
        if (initUse.groupId && initUse.groupAvatarUrl) {
          // 创建群聊
          await this.teamService.createTeam(
            {
              groupId: initUse.groupId,
              avatarUrl: initUse.groupAvatarUrl,
              introduction: initUse.groupIntroduction,
            },
            session.userInfo,
          );
        } else {
          this.lackOfParams();
        }
      }
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        talent: initUse.talent,
        groupId: initUse.isCreateTeam ? initUse.groupId : null,
        identity: initUse.identity.filter(
          (item: USER_IDENTITY) => item !== USER_IDENTITY.MANAGER,
        ),
      })
      .where('id=:id', { id: session.userInfo.id })
      .execute();

    const user = await this.userRepository.findOne({
      where: { id: session.userInfo.id },
    });

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

  lackOfGroupAvatarUrl() {
    throw new HttpException(
      {
        errorno: 654,
        errormsg: `缺少群头像`,
      },
      HttpStatus.OK,
    );
  }

  groupHasExist() {
    throw new HttpException(
      {
        errorno: 655,
        errormsg: `群名已存在`,
      },
      HttpStatus.OK,
    );
  }

  groupNotFound() {
    throw new HttpException(
      {
        errorno: 666,
        errormsg: `未找到该群名`,
      },
      HttpStatus.OK,
    );
  }

  lackOfParams() {
    throw new HttpException(
      {
        errorno: 657,
        errormsg: `缺少关键信息`,
      },
      HttpStatus.OK,
    );
  }

  confirmCodeInvalid() {
    throw new HttpException(
      {
        errorno: 656,
        errormsg: `学历验证码无效！`,
      },
      HttpStatus.OK,
    );
  }
}
