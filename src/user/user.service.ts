import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import axios from 'axios';

@Injectable()
export class UserService {

  @InjectRepository(User) private userRepository: Repository<User>
  async register({ code }: { code: string, nickName: string, avatarUrl: string }) {
    console.log(code)
    const data = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=wx559e4273b8badf2a&secret=7b8954140d68ecf74f21f53b058138e6&grant_type=authorization_code&js_code=${code}`)
    console.log(data.data)
  }

}
