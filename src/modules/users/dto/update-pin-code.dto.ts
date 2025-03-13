import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString, Length, IsNotEmpty } from 'class-validator';
import { IsMatch } from '../../../decorators/validators.decorator';

export class UpdatePinCodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(4, 4, {
    message: 'Pin code must be 4 digits',
  })
  readonly newPinCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @IsMatch('newPinCode', {
    message: 'Confirm pin code must match new pin code',
  })
  readonly confirmPinCode: string;
}
