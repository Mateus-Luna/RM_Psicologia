import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackupService {
  constructor(private readonly prisma: PrismaService) {}

  private getDatabasePath(): string {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not configured.');
    }

    if (!databaseUrl.startsWith('file:')) {
      throw new Error(
        'Backup currently supports only SQLite file databases.',
      );
    }

    const databasePath = databaseUrl.replace(/^file:/, '').split('?')[0];

    return isAbsolute(databasePath)
      ? databasePath
      : resolve(process.cwd(), databasePath);
  }

  async createBackup(): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    try {
      const databasePath = this.getDatabasePath();

      if (!existsSync(databasePath)) {
        throw new Error(
          `SQLite database file was not found: ${databasePath}`,
        );
      }

      /*
       * SQLite may have pending changes in the WAL file.
       * Checkpointing ensures the database file contains the
       * latest committed changes before we copy it.
       */
      await this.prisma.$queryRawUnsafe(
        'PRAGMA wal_checkpoint(TRUNCATE)',
      );

      const buffer = await readFile(databasePath);

      const now = new Date();

      const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');

      const time = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('-');

      const filename = `RM-Psicologia-Backup-${date}-${time}.db`;

      return {
        buffer,
        filename,
      };
    } catch (error) {
      console.error('Failed to create database backup:', error);

      throw new InternalServerErrorException(
        'Não foi possível criar o backup do banco de dados.',
      );
    }
  }
}