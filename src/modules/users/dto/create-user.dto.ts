import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { IsUsPhoneNumber } from '../../../decorators/validators.decorator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  readonly firstName: string;

  @ApiProperty()
  @IsString()
  readonly lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @ApiProperty()
  @IsEmail()
  readonly email: string;

  @ApiProperty()
  @IsUsPhoneNumber(null, {
    message:
      'The phone is not a valid format of International US phone number.',
  })
  readonly phone: string;

  @ApiProperty()
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

  @ApiPropertyOptional({
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly weight: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly skinColor: string;
}
