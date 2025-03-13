import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NoonlightService } from './noonlight.service';

@Module({
  imports: [ConfigModule],
  providers: [NoonlightService],
  exports: [NoonlightService],
})
export class NoonlightModule {}
