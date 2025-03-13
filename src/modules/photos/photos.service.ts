import { Injectable } from '@nestjs/common';
import { FileUploadService } from '../../utilities/file-upload';

@Injectable()
export class PhotosService {
  constructor(private readonly fileUploadService: FileUploadService) {}

  getUploadPhotoURL(fileName: string): Promise<any> {
    return this.fileUploadService.getPresignedPostData(fileName);
  }
}
