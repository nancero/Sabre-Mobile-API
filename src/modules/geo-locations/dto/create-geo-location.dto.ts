import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateGeoLocationDto {
  @ApiProperty()
  @IsNumber()
  readonly latitude?: any;

  @ApiProperty()
  @IsNumber()
  readonly longitude?: any;

  @ApiProperty()
  @IsNumber()
  readonly accuracy?: any;

  @ApiProperty()
  @IsString()
  readonly alertId?: any;
}
