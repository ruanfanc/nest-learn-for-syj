import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsNumberArray, IsStringArray } from "src/common";
import { CASE_TYPE_MAP_VALUE } from "../types";

export class SubmitCaseDto {
  @IsNotEmpty()
  @IsBoolean()
  isSubmit: boolean;
  @IsOptional()
  @IsString()
  id: string;
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