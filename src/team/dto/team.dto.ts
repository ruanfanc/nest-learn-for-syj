import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JoinTeam {
  @IsNumber()
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  @IsBoolean()
  pass: boolean;
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
}
