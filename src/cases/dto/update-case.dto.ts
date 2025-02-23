import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsNumberArray } from 'src/common';
import { CASE_STATUS } from '../types';
import { SubmitCaseDto } from './create-case.dto';

export class UpdateCaseDto extends PartialType(SubmitCaseDto) {}

export class DeleteDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

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

export class HandlepCaseDto {
  @IsNotEmpty()
  @IsNumber()
  caseId: number;
  @IsNotEmpty()
  @IsBoolean()
  isHandle: boolean;
  @IsOptional()
  @IsString()
  groupId: string;
}

export class CompleteCaseDto {
  @IsNotEmpty()
  @IsNumber()
  caseId: number;
}

export class AgreeHandlepCaseDto {
  @IsNotEmpty()
  @IsNumber()
  caseId: number;
  @IsNotEmpty()
  @IsString()
  groupId: string;
}

export class ReEntrustCaseDto {
  @IsNotEmpty()
  @IsNumber()
  caseId: number;
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
  @IsNumberArray()
  status: CASE_STATUS[];
  @IsOptional()
  @IsString()
  groupId: string;
  @IsOptional()
  @IsString()
  startTime: string;
  @IsOptional()
  @IsString()
  endTime: string;
  @IsOptional()
  @IsBoolean()
  orderByTime: boolean;
  @IsOptional()
  @IsBoolean()
  related: boolean;
  /** 1 帖子
      2 案件 */
  @IsOptional()
  @IsNumber()
  type: number;
}
