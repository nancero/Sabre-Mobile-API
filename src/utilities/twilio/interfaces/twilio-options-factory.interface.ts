import { TwilioOptions } from './twilio-options.interface';

export interface TwilioOptionsFactory {
  createTwilioOptions(): Promise<TwilioOptions> | TwilioOptions;
}
