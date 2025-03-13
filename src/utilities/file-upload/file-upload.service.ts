import { Injectable, Inject } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { FILE_UPLOAD_OPTIONS } from './constants/file-upload-options.constants';
import { FileUploadOptions } from './interfaces/file-upload-options.interface';

type FileUpload = {
  name: string;
  url: string;
};
@Injectable()
export class FileUploadService {
  s3Instance: AWS.S3 = null;
  upload = null;
  constructor(
    @Inject(FILE_UPLOAD_OPTIONS)
    private readonly fileUploadOptions: FileUploadOptions,
  ) {
    AWS.config.update({
      signatureVersion: 'v4',
      accessKeyId: fileUploadOptions.awsAccessKeyId,
      secretAccessKey: fileUploadOptions.awsSecretAccessKey,
      region: fileUploadOptions.awsRegion,
    });
    this.s3Instance = new AWS.S3({
      signatureVersion: 'v4',
    });
  }

  public async getPresignedPostData(
    fileName: string,
    // mime: string,
  ): Promise<any> {
    const params = {
      Bucket: this.fileUploadOptions.awsBucketName,
      Fields: {
        key: fileName,
        // 'Content-Type': mime,
      },
      Expires: 3600,
      Conditions: [
        ['content-length-range', 0, 10485760], // 10 Mb
        { acl: 'public-read' },
        // ['eq', '$Content-Type', mime],
      ],
    };
    return new Promise((resolve, reject) => {
      this.s3Instance.createPresignedPost(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  // public validSignedURL(fileName: string, fileType: string) {
  //   const params = {
  //     Bucket: this.fileUploadOptions.awsBucketName,
  //     Key: fileName,
  //     // Expires: 60,
  //     ContentType: fileType,
  //     ACL: 'public-read',
  //   };

  //   return new Promise((resolve, reject) => {
  //     this.s3Instance
  //       .headObject(params)
  //       .promise()
  //       .then(data => {
  //         // console.log('s3 File exists' + data);
  //         resolve(this.getSignedURL(fileName, fileType));
  //       })
  //       .catch(err => {
  //         // console.log('Generating Presigned Link ... Failed' + err);
  //         reject(err);
  //       });
  //   });
  // }

  public deleteFile(file: FileUpload): Promise<any> {
    const params = {
      Key: file.name,
      Bucket: this.fileUploadOptions.awsBucketName,
    };

    return this.s3Instance.deleteObject(params).promise();
  }
}
