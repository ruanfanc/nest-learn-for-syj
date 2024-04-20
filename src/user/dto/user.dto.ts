import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsNumberArray } from 'src/common';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  code: string;
  @IsNotEmpty()
  @IsString()
  nickName: string;
  avatarUrl: string;
}

export class InitUserDto {
  @IsNotEmpty()
  @IsNumberArray()
  identity: any;

  @IsNotEmpty()
  @IsString()
  identityID: string;

  @IsOptional()
  @IsString()
  talent: string;

  @IsOptional()
  @IsNumber()
  groupId: number;

  @IsOptional()
  @IsString()
  confirmCode: string;

  @IsOptional()
  @IsString()
  teacherDegreeLevels: string;
}
