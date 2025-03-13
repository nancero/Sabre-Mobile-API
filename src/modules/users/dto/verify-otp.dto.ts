import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumberString } from 'class-validator';
import { VerificationMethod } from '../../../constants/enums';

export class VerifyOTPDto {
  @ApiProperty({
    enum: VerificationMethod,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(VerificationMethod)
  readonly verificationMethod: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  readonly OTP: string;
}
