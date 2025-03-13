import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  readonly newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly oldPassword: string;
}
