import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class JoinTeam {
  @IsNumber()
  @IsNotEmpty()
  id: number;
  @IsNotEmpty()
  @IsBoolean()
  pass: boolean;
}
