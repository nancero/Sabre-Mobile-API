import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';
import { convertPhone } from '../common/helpers/phone-utils';

export function IsUsPhoneNumber(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsUsPhoneNumber',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          const phone = convertPhone(value);
          return phone.length === 12 && phone.startsWith('+1');
        },
      },
    });
  };
}

export const IsMatch = (
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator => {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'IsMatch',
      propertyName,
      target: object.constructor,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
      },
    });
  };
};
