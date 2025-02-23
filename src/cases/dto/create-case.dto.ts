import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CASE_TYPE_MAP_VALUE } from '../types';

export class EditCaseDto {
  @IsNotEmpty()
  @IsBoolean()
  isSubmit: boolean;

  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  contentText: string;

  @IsOptional()
  caseType: CASE_TYPE_MAP_VALUE;
}
export class SubmitCaseDto {
  @IsNotEmpty()
  @IsBoolean()
  isSubmit: boolean;
  @IsOptional()
  @IsString()
  id: number;
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsNotEmpty()
  @IsString()
  contentText: string;
  @IsNotEmpty()
  @IsOptional()
  caseType: CASE_TYPE_MAP_VALUE;
}
