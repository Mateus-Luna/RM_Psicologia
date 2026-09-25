import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import Database from 'better-sqlite3';

export function runPendingMigrations(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || !databaseUrl.startsWith('file:')) {
    return;
  }

  const databasePath = databaseUrl.replace(/^file:/, '').split('?')[0];
  const resolvedDbPath = isAbsolute(databasePath)
    ? databasePath
    : resolve(process.cwd(), databasePath);

  // Ensure parent directory exists
  const parentDir = dirname(resolvedDbPath);
  if (!existsSync(parentDir)) {
    const fs = require('node:fs');
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Find migrations directory
  const possibleMigrationDirs = [
    process.env.MIGRATIONS_DIR,
    resolve(process.cwd(), 'prisma', 'migrations'),
    resolve(process.cwd(), '..', 'backend', 'prisma', 'migrations'),
    resolve(__dirname, '..', '..', 'prisma', 'migrations'),
    resolve(__dirname, '..', '..', '..', 'prisma', 'migrations'),
  ].filter((dir): dir is string => Boolean(dir && existsSync(dir)));

  const migrationsDir = possibleMigrationDirs[0];

  if (!migrationsDir) {
    return;
  }

  const db = new Database(resolvedDbPath);

  try {
    // Ensure Prisma migrations metadata table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                    TEXT PRIMARY KEY NOT NULL,
        "checksum"              TEXT NOT NULL,
        "finished_at"           DATETIME,
        "migration_name"        TEXT NOT NULL,
        "logs"                  TEXT,
        "rolled_back_at"        DATETIME,
        "started_at"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
      );
    `);

    // Fetch applied migrations
    const appliedRows = db
      .prepare('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')
      .all() as Array<{ migration_name: string }>;

    const appliedSet = new Set(appliedRows.map((r) => r.migration_name));

    // Get migration directories in chronological order
    const migrationEntries = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const migrationName of migrationEntries) {
      if (appliedSet.has(migrationName)) {
        continue;
      }

      const sqlPath = join(migrationsDir, migrationName, 'migration.sql');
      if (!existsSync(sqlPath)) {
        continue;
      }

      const sqlContent = readFileSync(sqlPath, 'utf8');
      const checksum = createHash('sha256').update(sqlContent).digest('hex');
      const migrationId = require('node:crypto').randomUUID();

      const runMigrationTx = db.transaction(() => {
        db.exec(sqlContent);

        db.prepare(`
          INSERT INTO "_prisma_migrations" (
            id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
          ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, NULL, NULL, CURRENT_TIMESTAMP, 1)
        `).run(migrationId, checksum, migrationName);
      });

      runMigrationTx();
      console.log(`[MigrationRunner] Migration aplicada com sucesso: ${migrationName}`);
    }
  } catch (error) {
    console.error('[MigrationRunner] Erro ao aplicar migrações do banco de dados:', error);
    throw error;
  } finally {
    db.close();
  }
}
