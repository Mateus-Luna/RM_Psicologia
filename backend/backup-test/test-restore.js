require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const sourceDatabase = path.resolve('backup-test/restore-test.db');
const backupFile = path.resolve('backup-test/dev-backup-test.db');

console.log('========================================');
console.log(' TESTE DE RESTAURAÇÃO');
console.log('========================================\n');

if (!fs.existsSync(sourceDatabase)) {
  throw new Error(`Banco de teste não encontrado: ${sourceDatabase}`);
}

if (!fs.existsSync(backupFile)) {
  throw new Error(`Backup não encontrado: ${backupFile}`);
}

console.log('Banco de teste encontrado.');
console.log('Backup encontrado.\n');

/*
 * ============================================================
 * 1. LEITURA DO BANCO ANTES DA RESTAURAÇÃO
 * ============================================================
 */

console.log('=== 1. ESTADO ANTES DA RESTAURAÇÃO ===');

const databaseBefore = new Database(sourceDatabase, {
  readonly: true,
});

const patientsBefore = databaseBefore
  .prepare('SELECT COUNT(*) AS count FROM Patient')
  .get();

const appointmentsBefore = databaseBefore
  .prepare('SELECT COUNT(*) AS count FROM Appointment')
  .get();

const medicalRecordsBefore = databaseBefore
  .prepare('SELECT COUNT(*) AS count FROM MedicalRecordEntry')
  .get();

const medicationsBefore = databaseBefore
  .prepare('SELECT COUNT(*) AS count FROM PatientMedication')
  .get();

console.log(`Pacientes: ${patientsBefore.count}`);
console.log(`Atendimentos: ${appointmentsBefore.count}`);
console.log(`Prontuários: ${medicalRecordsBefore.count}`);
console.log(`Medicamentos: ${medicationsBefore.count}`);

databaseBefore.close();

/*
 * ============================================================
 * 2. BACKUP DO BANCO DE TESTE
 * ============================================================
 */

console.log('\n=== 2. PROTEÇÃO DO BANCO DE TESTE ===');

const safetyCopy = path.resolve(
  'backup-test/restore-test-before.db',
);

fs.copyFileSync(sourceDatabase, safetyCopy);

console.log('Cópia de segurança criada:');
console.log(safetyCopy);

/*
 * ============================================================
 * 3. RESTAURAÇÃO
 * ============================================================
 */

console.log('\n=== 3. RESTAURAÇÃO ===');

fs.copyFileSync(backupFile, sourceDatabase);

console.log('Backup copiado para o banco de teste.');

/*
 * ============================================================
 * 4. VALIDAR SQLITE
 * ============================================================
 */

console.log('\n=== 4. VALIDAÇÃO SQLITE ===');

const restoredDatabase = new Database(sourceDatabase, {
  readonly: true,
});

const integrity = restoredDatabase
  .prepare('PRAGMA integrity_check')
  .get();

console.log(
  `Integrity check: ${integrity.integrity_check}`,
);

if (integrity.integrity_check !== 'ok') {
  restoredDatabase.close();
  throw new Error('O banco restaurado possui inconsistências.');
}

/*
 * ============================================================
 * 5. VALIDAR TABELAS
 * ============================================================
 */

console.log('\n=== 5. VALIDAÇÃO DAS TABELAS ===');

const tables = restoredDatabase
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
  `)
  .all();

const requiredTables = [
  'User',
  'Session',
  'Patient',
  'PatientMedication',
  'MedicalRecordEntry',
  'Appointment',
];

for (const tableName of requiredTables) {
  const exists = tables.some(
    (table) => table.name === tableName,
  );

  console.log(
    `${tableName}: ${exists ? 'OK' : 'FALHA'}`,
  );

  if (!exists) {
    restoredDatabase.close();
    throw new Error(
      `Tabela obrigatória não encontrada: ${tableName}`,
    );
  }
}

/*
 * ============================================================
 * 6. VALIDAR REGISTROS
 * ============================================================
 */

console.log('\n=== 6. VALIDAÇÃO DOS REGISTROS ===');

const counts = {
  User: restoredDatabase
    .prepare('SELECT COUNT(*) AS count FROM User')
    .get().count,

  Session: restoredDatabase
    .prepare('SELECT COUNT(*) AS count FROM Session')
    .get().count,

  Patient: restoredDatabase
    .prepare('SELECT COUNT(*) AS count FROM Patient')
    .get().count,

  PatientMedication: restoredDatabase
    .prepare('SELECT COUNT(*) AS count FROM PatientMedication')
    .get().count,

  MedicalRecordEntry: restoredDatabase
    .prepare('SELECT COUNT(*) AS count FROM MedicalRecordEntry')
    .get().count,

  Appointment: restoredDatabase
    .prepare('SELECT COUNT(*) AS count FROM Appointment')
    .get().count,
};

for (const [table, count] of Object.entries(counts)) {
  console.log(`${table}: ${count}`);
}

/*
 * ============================================================
 * 7. COMPARAR COM O BACKUP ORIGINAL
 * ============================================================
 */

console.log('\n=== 7. COMPARAÇÃO COM O BACKUP ===');

const originalBackup = new Database(backupFile, {
  readonly: true,
});

const tablesToCompare = [
  'User',
  'Session',
  'Patient',
  'PatientMedication',
  'MedicalRecordEntry',
  'Appointment',
];

for (const table of tablesToCompare) {
  const restoredCount = restoredDatabase
    .prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
    .get().count;

  const backupCount = originalBackup
    .prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
    .get().count;

  const equal = restoredCount === backupCount;

  console.log(
    `${table}: ${equal ? 'OK' : 'FALHA'} (${restoredCount} = ${backupCount})`,
  );

  if (!equal) {
    restoredDatabase.close();
    originalBackup.close();

    throw new Error(
      `Quantidade de registros diferente na tabela ${table}.`,
    );
  }
}

originalBackup.close();
restoredDatabase.close();

/*
 * ============================================================
 * 8. RESULTADO
 * ============================================================
 */

console.log('\n========================================');
console.log(' RESULTADO');
console.log('========================================');

console.log('RESTORE DE TESTE CONCLUÍDO COM SUCESSO.');
console.log('');
console.log('O banco de teste foi restaurado a partir');
console.log('do arquivo de backup e passou nas validações.');
console.log('');
console.log(`Cópia anterior preservada em:`);
console.log(safetyCopy);