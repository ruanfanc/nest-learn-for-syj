import { Type } from "class-transformer";
import { IsArray, IsEmpty, IsNotEmpty, IsOptional, IsString, ValidateNested, ValidationOptions, isArray, registerDecorator } from "class-validator";
import { isInt16Array } from "util/types";

function IsNumberArray() {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsNumberArray',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: { message: "类型为numberArray" },
            validator: {
                validate(value: any) {
                    return Array.isArray(value) && value.every(item => typeof item === 'number');
                },
            },
        });
    };
}

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