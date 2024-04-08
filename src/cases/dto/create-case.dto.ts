import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsNumberArray, IsStringArray } from "src/common";
import { CASE_TYPE_MAP_VALUE } from "../types";

export class CreateCaseDto {
  @IsNotEmpty()
  @IsBoolean()
  isSubmit: boolean;
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsNotEmpty()
  @IsString()
  content: string;
  @IsNotEmpty()
  @IsOptional()
  caseType: CASE_TYPE_MAP_VALUE;
}