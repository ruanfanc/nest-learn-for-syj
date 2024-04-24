import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class JoinTeam {
  @IsNumber()
  @IsNotEmpty()
  id: string;
  @IsNotEmpty()
  @IsBoolean()
  pass: boolean;
}
