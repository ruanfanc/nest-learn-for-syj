import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { saveFilePath } from 'src/common/constant';

@Controller('files')
export class FileController {
  @Post('upload')
  async uploadFile(@Body('file') base64File: string, @Req() req: any) {
    if (!base64File) {
      throw new BadRequestException('文件不能为空');
    }

    // 解析 base64 文件
    const matches = base64File.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('无效的文件格式');
    }
    const ext = matches[1].split('/')[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // 设置文件大小限制为 5MB
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxFileSize) {
      throw new BadRequestException('文件大小超过限制（最大5MB）');
    }

    const filename = `${uuidv4()}.${ext}`;
    // const filePath = join('/www/uploadFiles', filename);
    const filePath = join(saveFilePath, filename);
    // const filePath = join('/Users/didi/downloads', filename);

    await writeFile(filePath, buffer);

    const fileUrl = `https://www.akingbbb.cn/uploads/${filename}`;
    // const fileUrl = `http://localhost:4000/uploads/${filename}`;
    return {
      url: fileUrl,
    };
  }
}
