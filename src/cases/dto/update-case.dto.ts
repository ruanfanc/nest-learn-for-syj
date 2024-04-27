import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsStringArray } from 'src/common';
import { SubmitCaseDto } from './create-case.dto';

export class UpdateCaseDto extends PartialType(SubmitCaseDto) {}

export class AuditCaseDto {
  @IsNotEmpty()
  @IsBoolean()
  isPass: boolean;
  @IsNotEmpty()
  @IsNumber()
  id: number;
  @IsOptional()
  @IsString()
  auditComment: string;
}

export class CaseListDto {
  @IsNotEmpty()
  @IsNumber()
  pageNo: number;
  @IsNotEmpty()
  @IsNumber()
  pageSize: number;
  @IsOptional()
  @IsString()
  userId: string;
  @IsOptional()
  @IsStringArray()
  status: string;
  @IsOptional()
  @IsString()
  relateGroup: string;
  @IsOptional()
  @IsString()
  pendingRelateGroup: string;
  @IsOptional()
  @IsString()
  startTime: string;
  @IsOptional()
  @IsString()
  endTime: string;
}
