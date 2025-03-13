import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class URLShortenerService {
  async shorten(url: string) {
    try {
      const result = await axios.get(
        'http://tinyurl.com/api-create.php?url=' + encodeURIComponent(url),
      );
      return result.data;
    } catch (err) {
      throw err;
    }
  }
}
