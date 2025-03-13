import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { VerificationMethod } from '../../../constants/enums';

export class VerifyResetPasswordOTPDTO {
  @ApiProperty()
  @IsString()
  readonly phone: string;

  @ApiProperty()
  @IsString()
  readonly OTP: string;

  @ApiProperty({
    enum: VerificationMethod,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(VerificationMethod)
  verificationMethod: string;
}
