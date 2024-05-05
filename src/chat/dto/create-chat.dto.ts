import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDto {}

export class ChangeChatDTO {
  @IsNotEmpty()
  @IsString()
  chatId: string;
}
