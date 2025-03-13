import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { VerificationMethod } from '../../../constants/enums';

export class SendOTPDTO {
  @ApiProperty({
    enum: VerificationMethod,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(VerificationMethod)
  verificationMethod: string;
}
