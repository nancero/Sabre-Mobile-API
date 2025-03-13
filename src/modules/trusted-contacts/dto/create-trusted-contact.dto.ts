import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsUsPhoneNumber } from '../../../decorators/validators.decorator';

export class CreateTrustedContactDto {
  @ApiProperty()
  @IsString()
  readonly firstName: string;

  @ApiProperty()
  @IsString()
  readonly lastName: string;

  @ApiProperty()
  @IsUsPhoneNumber(null, {
    message:
      'The phone is not a valid format of International US phone number.',
  })
  readonly phone: string;
}
