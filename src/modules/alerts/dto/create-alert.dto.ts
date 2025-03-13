import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty()
  @IsNumber()
  readonly accuracy: number;

  @ApiProperty()
  @IsNumber()
  readonly latitude: number;

  @ApiProperty()
  @IsNumber()
  readonly longitude: number;

  @ApiProperty()
  @IsBoolean()
  readonly isTriggerByDevice: boolean;
}
