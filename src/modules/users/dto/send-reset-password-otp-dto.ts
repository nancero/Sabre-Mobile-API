import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { VerificationMethod } from '../../../constants/enums';

export class SendResetPasswordOTP {
  @ApiProperty()
  @IsString()
  readonly phone: string;

  @ApiProperty({
    enum: VerificationMethod,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(VerificationMethod)
  verificationMethod: string;
}
