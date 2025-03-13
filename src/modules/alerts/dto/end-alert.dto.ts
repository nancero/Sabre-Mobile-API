import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';

export class EndAlertDto {
  @ApiProperty()
  @IsNumber()
  readonly latitude: number;

  @ApiProperty()
  @IsNumber()
  readonly longitude: number;

  @ApiProperty()
  @IsNumber()
  readonly accuracy: number;

  @ApiProperty()
  @IsString()
  @Length(4, 4, {
    message: 'Pin code must be 4 digits',
  })
  readonly pinCode: string;
}
