import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { IsUsPhoneNumber } from '../../../decorators/validators.decorator';

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUsPhoneNumber(null, {
    message:
      'The phone is not a valid format of International US phone number.',
  })
  readonly phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  readonly password: string;
}
