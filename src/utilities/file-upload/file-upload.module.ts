import { Module, DynamicModule } from '@nestjs/common';
import { FileUploadCoreModule } from './file-upload-core.module';
import { FileUploadOptions } from './interfaces/file-upload-options.interface';
import { FileUploadAsyncOptions } from './interfaces/file-upload-async-options.interface';

@Module({})
export class FileUploadModule {
  public static forRoot(options?: FileUploadOptions): DynamicModule {
    return {
      module: FileUploadModule,
      imports: [
        // modules
        FileUploadCoreModule.forRoot(options),
      ],
    };
  }

  public static forRootAsync(options: FileUploadAsyncOptions): DynamicModule {
    return {
      module: FileUploadModule,
      imports: [
        // modules
        FileUploadCoreModule.forRootAsync(options),
      ],
    };
  }
}
