const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const PRIVATE_KEY_PATH = path.join(
  __dirname,
  '..',
  'electron',
  'license',
  'private.pem',
);

const PRODUCT_ID = 'psi-ficha';
const LICENSE_VERSION = 1;

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value)
    ? value
    : Buffer.from(value, 'utf8');

  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function generateLicense(machineId, customerName) {
  if (!machineId) {
    throw new Error('Informe o identificador da máquina.');
  }

  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error(
      `Chave privada não encontrada: ${PRIVATE_KEY_PATH}`,
    );
  }

  const payload = {
    version: LICENSE_VERSION,
    product: PRODUCT_ID,
    customer: customerName || 'Cliente',
    machine: machineId.trim().toLowerCase(),
    issuedAt: new Date().toISOString(),
    expiresAt: null,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadEncoded = base64UrlEncode(payloadJson);

  const signer = crypto.createSign('RSA-SHA256');

  signer.update(Buffer.from(payloadEncoded, 'utf8'));
  signer.end();

  const signature = signer.sign(
    fs.readFileSync(PRIVATE_KEY_PATH),
  );

  const signatureEncoded = base64UrlEncode(signature);

  return `${payloadEncoded}.${signatureEncoded}`;
}

const machineId = process.argv[2];
const customerName = process.argv[3];

if (!machineId) {
  console.log(
    'Uso: node tools/generate-license.cjs MACHINE_ID "Nome do Cliente"',
  );
  process.exit(1);
}

try {
  const license = generateLicense(
    machineId,
    customerName,
  );

  console.log('\nLICENÇA GERADA:\n');
  console.log(license);
  console.log('\n');
} catch (error) {
  console.error('Erro:', error.message);
  process.exit(1);
}