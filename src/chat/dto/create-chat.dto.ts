import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsStringArray } from 'src/common';
import { ChatType } from '../entities/chat.entity';

export class CreateChatDto {}

export class ChangeChatDTO {
  @IsNotEmpty()
  @IsString()
  chatId: string;
}

export class GetChatDetailDTO {
  @IsNotEmpty()
  @IsNumber()
  chatRoomId: number;
  @IsNotEmpty()
  @IsNumber()
  pageNo: number;
  @IsNotEmpty()
  @IsNumber()
  pageSize: number;
}

export class CreateRoomDTO {
  @IsNotEmpty()
  @IsStringArray()
  chatObjIds: string[];
  @IsOptional()
  @IsString()
  chatRoomName?: string;
  @IsOptional()
  @IsNumber()
  caseId?: number;
  @IsOptional()
  @IsNumber()
  type?: ChatType;
  @IsOptional()
  joinTeamApplyInfo?: {
    groupId: string;
    userId: number;
  };

  @IsOptional()
  teamHanldeCaseInfo?: {
    groupId: string;
    caseId: number;
  };

  @IsOptional()
  publicAgreeHandleInfo?: {
    caseId: number;
  };
}

export class SendMessageDTO {
  @IsNotEmpty()
  @IsNumber()
  chatRoomId: number;
  @IsNotEmpty()
  @IsString()
  content: string;
}
