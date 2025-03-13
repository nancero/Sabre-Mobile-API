import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly firstName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly lastName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly avatar: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly medicalInformation: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly gender: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly hairColor: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly eyeColor: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly height: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly weight: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly skinColor: string;
}
