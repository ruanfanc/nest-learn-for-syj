import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuthLevel } from '../entities/team.entity';
import { IsStringArray } from 'src/common';

export class JoinTeam {
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  @IsBoolean()
  isPass: boolean;
  @IsNotEmpty()
  @IsString()
  groupId: string;
}

export class ApplyTeam {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @IsString()
  groupId: string;
}

export class Members {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class AddManager {
  @IsString()
  @IsNotEmpty()
  id: string;
  @IsStringArray()
  @IsNotEmpty()
  userIds: string;
  @IsBoolean()
  @IsNotEmpty()
  isAdd: boolean;
  @IsNumber()
  @IsOptional()
  level?: AuthLevel;
}

export class AddMember {
  @IsString()
  @IsNotEmpty()
  id: string;
  @IsStringArray()
  @IsNotEmpty()
  userIds: string[];
  @IsBoolean()
  @IsNotEmpty()
  isAdd: boolean;
}
