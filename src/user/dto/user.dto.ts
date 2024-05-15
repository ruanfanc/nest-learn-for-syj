import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNumberArray } from 'src/common';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  code: string;
  @IsOptional()
  @IsString()
  nickName?: string;
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class InitUserDto {
  @IsNotEmpty()
  @IsNumberArray()
  identity: any;

  @IsOptional()
  @IsString()
  identityID: string;

  @IsOptional()
  @IsNumberArray()
  talent: number[];

  @IsOptional()
  @IsString()
  groupId: string;

  @IsOptional()
  @IsString()
  confirmCode: string;

  @IsOptional()
  @IsString()
  teacherDegreeLevels: string;
}

export class GetUserDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
