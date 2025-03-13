import { IsString } from 'class-validator';

export class CreateLogDto {
  @IsString()
  location: string;

  @IsString()
  message: string;
}
