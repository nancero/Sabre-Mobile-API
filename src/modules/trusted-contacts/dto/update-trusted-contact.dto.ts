import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { IsUsPhoneNumber } from '../../../decorators/validators.decorator';

export class UpdateTrustedContactDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly firstName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  readonly lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUsPhoneNumber(null, {
    message:
      'The phone is not a valid format of International US phone number.',
  })
  readonly phone: string;
}
