import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Res } from '@nestjs/common';

import { BackupService } from './backup.service';
import { RestoreService } from './restore.service';

@Controller('backup')
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly restoreService: RestoreService,
  ) {}

  @Get()
  async createBackup(@Res() response: Response): Promise<void> {
    const { buffer, filename } =
      await this.backupService.createBackup();

    response.set({
      'Content-Type': 'application/x-sqlite3',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    });

    response.send(buffer);
  }

  @Post('restore')
  @UseInterceptors(FileInterceptor('file'))
  async restoreBackup(
    @UploadedFile() file?: {buffer: Buffer},
  ): Promise<{
    message: string;
    safetyBackupFilename: string;
  }> {
    if (!file) {
      throw new BadRequestException(
        'Nenhum arquivo de backup foi enviado.',
      );
    }

    if (!file.buffer) {
      throw new BadRequestException(
        'O arquivo de backup não contém dados válidos.',
      );
    }

    return this.restoreService.restore(file.buffer);
  }
}