import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { IAPService } from './iap.service';

@Module({
  imports: [ConfigModule],
  providers: [IAPService],
  exports: [IAPService],
})
export class IAPModule {}
