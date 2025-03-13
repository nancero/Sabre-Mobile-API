import { Global, Module, DynamicModule, Provider } from '@nestjs/common';
import { FileUploadAsyncOptions } from './interfaces/file-upload-async-options.interface';
import { FileUploadOptions } from './interfaces/file-upload-options.interface';
import { FILE_UPLOAD_OPTIONS } from './constants/file-upload-options.constants';
import { FileUploadOptionsFactory } from './interfaces/file-upload-options-factory.interface';
import { FileUploadService } from './file-upload.service';

@Global()
@Module({})
export class FileUploadCoreModule {
  static forRoot(options: FileUploadOptions): DynamicModule {
    const FileUploadOptionsProvider = {
      name: FILE_UPLOAD_OPTIONS,
      provide: FILE_UPLOAD_OPTIONS,
      useValue: options,
    };

    return {
      module: FileUploadCoreModule,
      providers: [FileUploadOptionsProvider, FileUploadService],
      exports: [FileUploadService],
    };
  }

  static forRootAsync(options: FileUploadAsyncOptions): DynamicModule {
    const imports = options.imports ? options.imports : [];
    const providers: Provider[] = this.createAsyncProviders(options);

    return {
      module: FileUploadCoreModule,
      providers: [
        // Providers
        ...providers,

        // Services
        FileUploadService,
      ],
      imports,
      exports: [FileUploadService],
    };
  }

  private static createAsyncProviders(
    options: FileUploadAsyncOptions,
  ): Provider[] {
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
    options: FileUploadAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        name: FILE_UPLOAD_OPTIONS,
        provide: FILE_UPLOAD_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      name: FILE_UPLOAD_OPTIONS,
      provide: FILE_UPLOAD_OPTIONS,
      useFactory: async (optionsFactory: FileUploadOptionsFactory) => {
        return optionsFactory.createFileUploadOptions();
      },
      inject: [options.useExisting || options.useClass],
    };
  }
}
