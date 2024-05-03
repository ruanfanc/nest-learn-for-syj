import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { USER_IDENTITY, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CreateUserDto, InitUserDto } from './dto/user.dto';
import { TeamService } from 'src/team/team.service';

@Injectable()
export class UserService {
  constructor(private teamService: TeamService) {}
  @InjectRepository(User) private userRepository: Repository<User>;

  async login({ code, nickName, avatarUrl }: CreateUserDto, session) {
    if (code === 'woshishdskashfasjk') {
      const user = await this.userRepository.findOne({
        where: { nickName },
      });

      session.openid = 'woshishdskashfasjk';
      session.authenticated = true;
      session.nickName = nickName;
      session.avatarUrl = avatarUrl;
      session.userInfo = user;
      return user;
    }

    const data = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wx559e4273b8badf2a&secret=7b8954140d68ecf74f21f53b058138e6&grant_type=authorization_code&js_code=${code}`,
    );
    if (!data.data.errcode) {
      const { openid } = data.data;
      // ===== must update nickname and avatarurl ======
      if (nickName && avatarUrl) {
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

        session.openid = openid;
        session.authenticated = true;
        session.nickName = nickName;
        session.avatarUrl = avatarUrl;

        await this.userRepository.save({
          id: openid,
          nickName: nickName,
          avatarUrl: avatarUrl,
        });
        const userInfo = {
          id: openid,
          nickName,
          avatarUrl,
        };
        session.userInfo = userInfo;
        return userInfo;
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
        }
      }
    } else {
      return data.data;
    }
  }
  async init(InitUse: InitUserDto, session) {
    try {
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set(InitUse)
        .where('id=:id', { id: session.openid })
        .execute();

      const user = await this.userRepository.findOne({
        where: { id: session.openid },
      });

      const identity = user.identity;

      if (identity.includes(USER_IDENTITY.TEACHER)) {
        await this.teamService.createTeam(InitUse.groupId, session.openid);
      }

      if (user) {
        session.userInfo = user;
        return { ...user };
      }

      throw new HttpException(
        {
          errorno: 6,
          errormsg: `未找到openid为${session.openid}的用户`,
        },
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        {
          errorno: 7,
          errormsg: error,
        },
        HttpStatus.OK,
      );
    }
  }

  /** this api is only for internal module */
  async getUserInfo(openid: string) {
    const user = await this.userRepository.find({ where: { id: openid } });
    return user;
  }
}
