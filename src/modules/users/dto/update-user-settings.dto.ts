import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  readonly notifyTrustedList: boolean;

  // @ApiPropertyOptional()
  // @IsBoolean()
  // @IsOptional()
  // readonly notifySabreUsers: boolean;

  // @ApiPropertyOptional()
  // @IsBoolean()
  // @IsOptional()
  // readonly firstResponders: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  readonly notifyFireDepartment: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  readonly notifyAmbulance: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  readonly notifyPolice: boolean;

  getSettings() {
    const { notifyTrustedList, notifyFireDepartment, notifyPolice } = this;
    return {
      notifyTrustedList,
      notifyFireDepartment,
      notifyPolice,
    };
  }
}
