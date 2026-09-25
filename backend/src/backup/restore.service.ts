import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import Database from 'better-sqlite3';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestoreService {
  constructor(private readonly prisma: PrismaService) {}

  private getDatabasePath(): string {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not configured.',
      );
    }

    if (!databaseUrl.startsWith('file:')) {
      throw new Error(
        'Restore currently supports only SQLite file databases.',
      );
    }

    const databasePath = databaseUrl.replace(/^file:/, '').split('?')[0];

    return isAbsolute(databasePath)
      ? databasePath
      : resolve(process.cwd(), databasePath);
  }

  private validateSQLiteDatabase(buffer: Buffer): void {
    const sqliteHeader = 'SQLite format 3\0';

    if (buffer.length < 100) {
      throw new BadRequestException(
        'O arquivo informado não é um banco SQLite válido.',
      );
    }

    const header = buffer
      .subarray(0, 16)
      .toString('latin1');

    if (header !== sqliteHeader) {
      throw new BadRequestException(
        'O arquivo informado não é um banco SQLite válido.',
      );
    }
  }

  private validateRequiredTables(databasePath: string): void {
    let database: Database.Database | null = null;

    try {
      database = new Database(databasePath, {
        readonly: true,
      });

      const tables = database
        .prepare(`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
        `)
        .all() as Array<{ name: string }>;

      const tableNames = new Set(
        tables.map((table) => table.name),
      );

      const requiredTables = [
        'User',
        'Session',
        'Patient',
        'PatientMedication',
        'MedicalRecordEntry',
        'Appointment',
      ];

      const missingTables = requiredTables.filter(
        (table) => !tableNames.has(table),
      );

      if (missingTables.length > 0) {
        throw new BadRequestException(
          `O backup não possui todas as tabelas necessárias: ${missingTables.join(', ')}`,
        );
      }

      const integrityResult = database
        .prepare('PRAGMA integrity_check')
        .get() as { integrity_check: string };

        if (integrityResult.integrity_check !== 'ok') {
        throw new BadRequestException(
            'O backup possui inconsistências internas no banco SQLite.',
        );
        }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Não foi possível validar a estrutura do banco de dados do backup.',
      );
    } finally {
      database?.close();
    }
  }

  async restore(buffer: Buffer): Promise<{
    message: string;
    safetyBackupFilename: string;
  }> {
    const databasePath = this.getDatabasePath();

    this.validateSQLiteDatabase(buffer);

    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'rm-psic-restore-'),
    );

    const temporaryDatabasePath = join(
      temporaryDirectory,
      'restore.db',
    );

    try {
      /*
       * 1. Grava o backup recebido em um arquivo temporário.
       */
      await writeFile(temporaryDatabasePath, buffer);

      /*
       * 2. Valida o SQLite antes de tocar no banco atual.
       */
      this.validateRequiredTables(temporaryDatabasePath);

      /*
       * 3. Garante que o banco atual existe.
       */
      if (!existsSync(databasePath)) {
        throw new InternalServerErrorException(
          'O banco de dados atual não foi encontrado.',
        );
      }

      /*
       * 4. Cria uma cópia de segurança do banco atual.
       */
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

      const safetyBackupFilename =
        `RM-Psicologia-Pre-Restore-${date}-${time}-${randomBytes(4).toString('hex')}.db`;

      const backupsDirectory =
        process.env.BACKUPS_DIR ||
        resolve(dirname(databasePath), '..', 'backups');

      const safetyBackupPath = resolve(
        backupsDirectory,
        safetyBackupFilename,
      );

      /*
       * O diretório precisa existir antes da cópia.
       */
      await mkdir(backupsDirectory, {
        recursive: true,
      });

      await copyFile(
        databasePath,
        safetyBackupPath,
      );

      /*
       * 5. Desconecta o Prisma para liberar o arquivo SQLite.
       */
      await this.prisma.$disconnect();

      try {
        /*
         * 6. Substitui o banco atual pelo banco validado.
         */
        await copyFile(
          temporaryDatabasePath,
          databasePath,
        );
      } catch (error) {
        /*
         * Se a substituição falhar, tenta restaurar
         * imediatamente o banco anterior.
         */
        try {
          await copyFile(
            safetyBackupPath,
            databasePath,
          );
        } catch {
          // Mantemos o erro original.
        }

        throw error;
      }

      /*
       * 7. Reconecta o Prisma ao banco restaurado.
       */
      await this.prisma.$connect();

      return {
        message: 'Banco de dados restaurado com sucesso.',
        safetyBackupFilename,
      };
    } catch (error) {
      console.error('Failed to restore database:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível restaurar o banco de dados.',
      );
    } finally {
      await rm(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  }
}