import { registerDecorator } from "class-validator";

export function IsNumberArray() {
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

export function IsStringArray() {
  return function (object: Object, propertyName: string) {
      registerDecorator({
          name: 'IsStringArray',
          target: object.constructor,
          propertyName: propertyName,
          constraints: [],
          options: { message: "类型为stringArray" },
          validator: {
              validate(value: any) {
                  return Array.isArray(value) && value.every(item => typeof item === 'string');
              },
          },
      });
  };
}