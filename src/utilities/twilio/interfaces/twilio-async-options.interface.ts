import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { TwilioOptionsFactory } from './twilio-options-factory.interface';
import { TwilioOptions } from './twilio-options.interface';

export interface TwilioAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<TwilioOptionsFactory>;
  useExisting?: Type<TwilioOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<TwilioOptions> | TwilioOptions;
}
