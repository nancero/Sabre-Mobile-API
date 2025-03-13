import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, Length } from 'class-validator';
import { IsMatch } from '../../../decorators/validators.decorator';

export class CreatePinCodeDto {
  @ApiProperty()
  @IsNumberString()
  @Length(4, 4, {
    message: 'Pin code must be 4 digits',
  })
  readonly newPinCode: string;

  @ApiProperty()
  @IsNumberString()
  @IsMatch('newPinCode', {
    message: 'Confirm pin code must match new pin code',
  })
  readonly confirmPinCode: string;
}
