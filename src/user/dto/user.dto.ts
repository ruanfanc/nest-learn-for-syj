import { Type } from "class-transformer";
import { IsArray, IsEmpty, IsNotEmpty, IsOptional, IsString, ValidateNested, ValidationOptions, isArray, registerDecorator } from "class-validator";
import { IsNumberArray } from "src/common";
import { isInt16Array } from "util/types";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    code: string;
    @IsNotEmpty()
    @IsString()
    nickName: string;
    avatarUrl: string
}

export class InitUserDto {
    @IsNotEmpty()
    @IsNumberArray()
    identity: any

    @IsNotEmpty()
    @IsString()
    identityID: string

    @IsOptional()
    @IsString()
    talent: string

    @IsOptional()
    @IsString()
    groupId: string

    @IsOptional()
    @IsString()
    confirmCode: string

    @IsOptional()
    @IsString()
    teacherDegreeLevels: string
}