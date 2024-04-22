import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CreateUserDto, InitUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  @InjectRepository(User) private userRepository: Repository<User>;

  async login({ code, nickName, avatarUrl }: CreateUserDto, session) {
    const data = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wx559e4273b8badf2a&secret=7b8954140d68ecf74f21f53b058138e6&grant_type=authorization_code&js_code=${code}`,
    );
    if (!data.data.errcode) {
      // const openid = 'woshishdskashfasjk';
      const { openid } = data.data;

      session.openid = openid;
      session.authenticated = true;
      session.nickName = nickName;
      session.avatarUrl = avatarUrl;

      const user = await this.userRepository.findOne({
        where: { id: openid },
      });
      if (user) {
        session.userInfo = user;
        return { ...user };
      }
      await this.userRepository.save({
        id: openid,
        nickName: nickName,
        avatarUrl: avatarUrl,
      });
      return {
        id: openid,
        nickName,
        avatarUrl,
      };
    } else {
      return data.data;
    }
  }
  async init(InitUse: InitUserDto, session) {
    this.userRepository
      .createQueryBuilder()
      .update(User)
      .set(InitUse)
      .where('id=:id', { id: session.openid })
      .execute();
    return {
      success: 200,
    };
  }

  /** this api is only for internal module */
  async getUserInfo(openid: string) {
    const user = await this.userRepository.find({ where: { id: openid } });
    return user;
  }
}
