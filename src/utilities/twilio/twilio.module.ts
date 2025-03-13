import { DynamicModule, Module, Global, Provider } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TWILIO_OPTIONS } from './constants/twilio-options.constant';
import { TwilioOptions } from './interfaces/twilio-options.interface';
import { TwilioOptionsFactory } from './interfaces/twilio-options-factory.interface';
import { TwilioAsyncOptions } from './interfaces/twilio-async-options.interface';

@Global()
@Module({})
export class TwilioModule {
  public static forRoot(options: TwilioOptions): DynamicModule {
    const TwilioOptionProvider = {
      name: TWILIO_OPTIONS,
      provide: TWILIO_OPTIONS,
      useValue: options,
    };
    return {
      module: TwilioModule,
      providers: [
        // Options
        TwilioOptionProvider,

        // Services
        TwilioService,
      ],
      exports: [TwilioService],
    };
  }

  public static forRootAsync(options: TwilioAsyncOptions): DynamicModule {
    const providers: Provider[] = this.createAsyncProviders(options);

    return {
      module: TwilioModule,
      providers: [
        // Providers
        ...providers,

        // Services
        TwilioService,
      ],
      imports: options.imports,
      exports: [
        // Services
        TwilioService,
      ],
    };
  }

  private static createAsyncProviders(options: TwilioAsyncOptions): Provider[] {
    const providers: Provider[] = [this.createAsyncOptionsProvider(options)];

    if (options.useClass) {
      providers.push({
        provide: options.useClass,
        useClass: options.useClass,
      });
    }

    return providers;
  }

  private static createAsyncOptionsProvider(
    options: TwilioAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        name: TWILIO_OPTIONS,
        provide: TWILIO_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      name: TWILIO_OPTIONS,
      provide: TWILIO_OPTIONS,
      useFactory: async (optionsFactory: TwilioOptionsFactory) => {
        return optionsFactory.createTwilioOptions();
      },
      inject: [options.useExisting || options.useClass],
    };
  }
}
