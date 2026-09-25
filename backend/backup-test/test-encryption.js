require('dotenv').config();

const Database = require('better-sqlite3');
const crypto = require('node:crypto');

const db = new Database('./backup-test/dev-backup-test.db', {
  readonly: true,
});

const encryptionKey = process.env.ENCRYPTION_KEY;

if (!encryptionKey) {
  throw new Error('ENCRYPTION_KEY não configurada.');
}

const key = crypto
  .createHash('sha256')
  .update(encryptionKey, 'utf8')
  .digest();

function decrypt(value) {
  if (!value) {
    return value;
  }

  const parts = value.split('.');

  if (parts.length !== 3) {
    throw new Error('Formato de valor criptografado inválido.');
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;

  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    iv,
    {
      authTagLength: 16,
    },
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

function isEncrypted(value) {
  if (!value) {
    return true;
  }

  return value.split('.').length === 3;
}

let totalTests = 0;
let successfulTests = 0;

function testField(label, value) {
  totalTests++;

  try {
    if (!value) {
      console.log(`${label}: vazio/nulo — OK`);
      successfulTests++;
      return;
    }

    if (!isEncrypted(value)) {
      throw new Error('Valor não possui formato criptografado.');
    }

    decrypt(value);

    console.log(`${label}: OK`);
    successfulTests++;
  } catch (error) {
    console.error(`${label}: FALHA`);
    console.error(`  ${error.message}`);
  }
}

console.log('========================================');
console.log(' TESTE COMPLETO DE CRIPTOGRAFIA');
console.log(' BACKUP: dev-backup-test.db');
console.log('========================================\n');

/*
 * ============================================================
 * 1. PACIENTES
 * ============================================================
 */

console.log('=== 1. PACIENTES ===');

const patients = db
  .prepare(`
    SELECT
      id,
      name,
      cpf,
      phone,
      diagnosticHypothesis,
      doctorName,
      generalNotes
    FROM Patient
  `)
  .all();

console.log(`Pacientes encontrados: ${patients.length}\n`);

for (const patient of patients) {
  console.log(`Paciente ID: ${patient.id}`);

  testField('  name', patient.name);
  testField('  cpf', patient.cpf);
  testField('  phone', patient.phone);
  testField(
    '  diagnosticHypothesis',
    patient.diagnosticHypothesis,
  );
  testField('  doctorName', patient.doctorName);
  testField('  generalNotes', patient.generalNotes);

  console.log('');
}

/*
 * ============================================================
 * 2. MEDICAMENTOS
 * ============================================================
 */

console.log('=== 2. MEDICAMENTOS ===');

const medications = db
  .prepare(`
    SELECT
      id,
      patientId,
      name,
      notes
    FROM PatientMedication
  `)
  .all();

console.log(`Medicamentos encontrados: ${medications.length}\n`);

for (const medication of medications) {
  console.log(
    `Medicamento ID: ${medication.id} (Paciente ${medication.patientId})`,
  );

  testField('  name', medication.name);
  testField('  notes', medication.notes);

  console.log('');
}

/*
 * ============================================================
 * 3. PRONTUÁRIOS
 * ============================================================
 */

console.log('=== 3. PRONTUÁRIOS ===');

const medicalRecords = db
  .prepare(`
    SELECT
      id,
      patientId,
      type,
      entryDate,
      content
    FROM MedicalRecordEntry
  `)
  .all();

console.log(
  `Registros de prontuário encontrados: ${medicalRecords.length}\n`,
);

for (const record of medicalRecords) {
  console.log(
    `Prontuário ID: ${record.id} (Paciente ${record.patientId})`,
  );

  testField('  content', record.content);

  console.log('');
}

/*
 * ============================================================
 * 4. ATENDIMENTOS
 * ============================================================
 */

console.log('=== 4. ATENDIMENTOS ===');

const appointments = db
  .prepare(`
    SELECT
      id,
      patientId,
      startAt,
      endAt,
      status,
      confirmed,
      notes,
      recurrenceId
    FROM Appointment
  `)
  .all();

console.log(`Atendimentos encontrados: ${appointments.length}\n`);

for (const appointment of appointments) {
  console.log(
    `Atendimento ID: ${appointment.id} (Paciente ${appointment.patientId})`,
  );

  testField('  notes', appointment.notes);

  console.log('');
}

/*
 * ============================================================
 * 5. RESULTADO
 * ============================================================
 */

console.log('========================================');
console.log(' RESULTADO FINAL');
console.log('========================================');

console.log(`Testes executados: ${totalTests}`);
console.log(`Testes bem-sucedidos: ${successfulTests}`);
console.log(`Testes com falha: ${totalTests - successfulTests}`);

if (successfulTests === totalTests) {
  console.log('\nBACKUP COMPLETAMENTE VALIDADO.');
  console.log('Todos os campos criptografados puderam ser');
  console.log('descriptografados usando a ENCRYPTION_KEY atual.');
} else {
  console.error('\nBACKUP POSSUI FALHAS.');
  console.error('Alguns campos não puderam ser validados.');
  process.exitCode = 1;
}

db.close();