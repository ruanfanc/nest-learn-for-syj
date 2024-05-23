import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AuthLevel } from '../entities/team.entity';

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
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsBoolean()
  @IsNotEmpty()
  isAdd: boolean;
  @IsNumber()
  @IsNotEmpty()
  level: AuthLevel;
}
