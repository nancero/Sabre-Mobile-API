import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { FileUploadOptionsFactory } from './file-upload-options-factory.interface';
import { FileUploadOptions } from './file-upload-options.interface';

export interface FileUploadAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useClass?: Type<FileUploadOptionsFactory>;
  useExisting?: Type<FileUploadOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<FileUploadOptions> | FileUploadOptions;
}
