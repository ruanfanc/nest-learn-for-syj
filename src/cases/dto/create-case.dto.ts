import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsNumberArray, IsStringArray } from "src/common";

export const CASE_TYPE_MAP = {
  1: '家庭婚姻',
  2: '借款借贷',
  3: '劳动工伤',
  4: '合同纠纷',
  5: '交通事故',
  6: '土地纠纷',
  7: '房产纠纷',
  8: '经济纠纷',
  9: '消费权益',
  10: '其它纠纷',
}

export type CASE_TYPE_MAP_Value = (keyof typeof CASE_TYPE_MAP)[]


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
  caseType: CASE_TYPE_MAP_Value;
}

export const enum CASE_STATUS  {
  WAITTING = 1,
  PROCESSING = 2,
  COMPELETE = 3,
  DRAFT = 4,
  WAIT_FOR_AUDIT = 5,
}

export const CASE_STATUS_MAP: { [key in CASE_STATUS]: string } = {
 1: '待受理',
 2: '受理中',
 3: '已完成 ',
 4: '草稿',
 5: '待审核'
}

export const CASES_BUTTONS_MAP = {
  1: '编辑',
  2: '详谈',
  3: '重新委托',
  4: '取消案件',
  5: '受理案件'
}

export type CASES_BUTTONS_MAP_Value = (keyof typeof CASES_BUTTONS_MAP)[]

export class InitCaseDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsString()
  title: string

  @IsNotEmpty()
  @IsString()
  contentText: string

  @IsOptional()
  @IsNumberArray()
  caseType: CASE_TYPE_MAP_Value

  @IsOptional()
  @IsStringArray()
  imgSrcs: string[]

  @IsNotEmpty()
  @IsString()
  avatarUrl: string

  @IsNotEmpty()
  @IsString()
  createTime: string

  @IsNotEmpty()
  @IsString()
  username: string

  @IsOptional()
  @IsString()
  userdesc: string

  @IsNotEmpty()
  @IsNumberArray()
  status: CASE_STATUS[]

  @IsNotEmpty()
  @IsNumberArray()
  buttons: CASES_BUTTONS_MAP_Value
}