const Database = require('better-sqlite3');

const db = new Database('./backup-test/RM-Psicologia-Backup.db', {
  readonly: true,
});

console.log('=== TESTE DO BACKUP ===');

const tables = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
  `)
  .all();

console.log('\nTabelas encontradas:');

for (const table of tables) {
  console.log(`- ${table.name}`);
}

console.log('\nQuantidade de registros:');

const expectedTables = [
  'User',
  'Session',
  'Patient',
  'PatientMedication',
  'MedicalRecordEntry',
  'Appointment',
];

for (const table of expectedTables) {
  const exists = tables.some((item) => item.name === table);

  if (!exists) {
    console.log(`${table}: TABELA NÃO ENCONTRADA`);
    continue;
  }

  const result = db
    .prepare(`SELECT COUNT(*) AS count FROM "${table}"`)
    .get();

  console.log(`${table}: ${result.count}`);
}

db.close();

console.log('\nBackup validado como SQLite.');