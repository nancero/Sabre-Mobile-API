import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import {
  IsUsPhoneNumber,
  IsMatch,
} from '../../../decorators/validators.decorator';

export class ResetPasswordDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  readonly newPassword: string;

  @ApiProperty({ type: 'string' })
  @IsNotEmpty()
  @IsMatch('newPassword', {
    message: 'confirm password must match newPassword field',
  })
  confirmPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly resetPasswordToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUsPhoneNumber(null, {
    message:
      'The phone is not a valid format of International US phone number.',
  })
  readonly phone: string;
}
