import { Controller, Post, Body, Session } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, GetUserDto, InitUserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/login')
  register(@Body() createUesrDto: CreateUserDto, @Session() session) {
    return this.userService.login(createUesrDto, session);
  }
  @Post('/init')
  init(@Body() initUser: InitUserDto, @Session() session) {
    return this.userService.init(initUser, session);
  }

  @Post('/getUserInfo')
  getUserInfo(@Body() getUserInfo: GetUserDto) {
    return this.userService.getUserInfo(getUserInfo.code);
  }
}
