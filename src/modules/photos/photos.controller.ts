import { Controller, Get, UseGuards } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';
import { UserRequest } from '../../decorators/user.decorator';
import { IUser } from '../users/interfaces/user.interface';

@Controller('photos')
@ApiBearerAuth()
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @UseGuards(AuthGuard)
  @Get('presigned-post-data')
  async getUploadPhotoURL(@UserRequest() user: IUser) {
    const now = Date.now();
    return await this.photosService.getUploadPhotoURL(`${user._id}_${now}`);
  }
}
