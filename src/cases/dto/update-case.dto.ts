import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubmitCaseDto } from './create-case.dto';

export class UpdateCaseDto extends PartialType(SubmitCaseDto) {}


export class AuditCaseDto {
  @IsNotEmpty()
  @IsBoolean()
  isPass: boolean;
  @IsNotEmpty()
  @IsString()
  id: string;
  @IsOptional()
  @IsString()
  auditComment: string;
}

export class CaseListDto {
  @IsOptional()
  @IsNumber()
  pageNo: number;
  @IsOptional()
  @IsNumber()
  pageSize: number;
}