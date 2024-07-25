import { Injectable } from '@nestjs/common';
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: './uploads', // Destination folder relative to your project root
      fileFilter: (req, file, callback) => {
        if (file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          callback(null, true);
        } else {
          callback(new Error('Invalid file type: Only JPG, JPEG, PNG, and GIF files are allowed.'), false);
        }
      },
      storage: diskStorage({
        destination: './uploads', // Storage path for uploaded files
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const extension = path.extname(file.originalname);
          const baseName = path.basename(file.originalname, extension);
          callback(null, `${baseName}-${uniqueSuffix}${extension}`);
        },
      }),
    };
  }
}
