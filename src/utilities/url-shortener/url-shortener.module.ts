import { Module } from '@nestjs/common';
import { URLShortenerService } from './url-shortener.service';

@Module({
  providers: [URLShortenerService],
  exports: [URLShortenerService],
})
export class URLShortenerModule {}
