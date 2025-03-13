import { FileUploadOptions } from './file-upload-options.interface';

export interface FileUploadOptionsFactory {
  createFileUploadOptions(): Promise<FileUploadOptions> | FileUploadOptions;
}
