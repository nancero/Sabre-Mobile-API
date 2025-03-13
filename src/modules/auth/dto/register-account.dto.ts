import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  IsUsPhoneNumber,
  IsMatch,
} from '../../../decorators/validators.decorator';

export class RegisterAccountDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  readonly password: string;

  @ApiProperty()
  @IsMatch('password', {
    message: 'confirm password must match password field',
  })
  confirmPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUsPhoneNumber(null, {
    message:
      'The phone is not a valid format of International US phone number.',
  })
  readonly phone: string;
}
