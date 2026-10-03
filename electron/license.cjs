const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LICENSE_FILE_NAME = 'license.dat';
const LICENSE_VERSION = 1;
const PRODUCT_ID = 'psi-ficha';

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padding = normalized.length % 4;
  const padded = normalized + (padding ? '='.repeat(4 - padding) : '');

  return Buffer.from(padded, 'base64');
}

function getWindowsMachineGuid() {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    const output = execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '(Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Cryptography" -Name MachineGuid).MachineGuid',
      ],
      {
        encoding: 'utf8',
        windowsHide: true,
      },
    );

    const machineGuid = output.trim();

    if (machineGuid) {
      return machineGuid;
    }
  } catch (error) {
    console.error(
      '[License] Não foi possível obter o MachineGuid:',
      error.message,
    );
  }

  return null;
}

function getMachineFingerprint() {
  const machineGuid = getWindowsMachineGuid();

  const fallbackData = [
    process.platform,
    process.arch,
    process.env.COMPUTERNAME || '',
    process.env.USERNAME || '',
  ].join('|');

  const source = machineGuid || fallbackData;

  return crypto
    .createHash('sha256')
    .update(`psi-ficha-machine:${source}`)
    .digest('hex');
}

function getMachineId() {
  return getMachineFingerprint().toUpperCase();}

function getLicensePath(userDataPath) {
  return path.join(userDataPath, LICENSE_FILE_NAME);
}

function parseLicenseToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Licença vazia.');
  }

  const parts = token.trim().split('.');

  if (parts.length !== 2) {
    throw new Error('Formato de licença inválido.');
  }

  const payloadBuffer = base64UrlDecode(parts[0]);
  const signatureBuffer = base64UrlDecode(parts[1]);

  const payloadText = payloadBuffer.toString('utf8');
  const payload = JSON.parse(payloadText);

  return {
    payload,
    payloadEncoded: parts[0],
    signature: signatureBuffer,
  };
}

function verifyLicenseToken(token, publicKey) {
  try {
    const {
      payload,
      payloadEncoded,
      signature,
    } = parseLicenseToken(token);

    if (payload.version !== LICENSE_VERSION) {
      return {
        valid: false,
        reason: 'Versão da licença não suportada.',
      };
    }

    if (payload.product !== PRODUCT_ID) {
      return {
        valid: false,
        reason: 'A licença não pertence a este aplicativo.',
      };
    }

    if (!payload.machine) {
      return {
        valid: false,
        reason: 'Licença sem identificação de máquina.',
      };
    }

    const currentMachine = getMachineFingerprint();

    if (payload.machine !== currentMachine) {
      return {
        valid: false,
        reason: 'Esta licença pertence a outro computador.',
      };
    }

    const verifier = crypto.createVerify('RSA-SHA256');

    verifier.update(payloadEncoded);
    verifier.end();

    const signatureValid = verifier.verify(
      publicKey,
      signature,
    );

    if (!signatureValid) {
      return {
        valid: false,
        reason: 'Assinatura da licença inválida.',
      };
    }

    if (payload.expiresAt) {
      const expirationDate = new Date(payload.expiresAt);

      if (
        Number.isNaN(expirationDate.getTime()) ||
        expirationDate.getTime() < Date.now()
      ) {
        return {
          valid: false,
          reason: 'A licença está expirada.',
        };
      }
    }

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      reason: `Licença inválida: ${error.message}`,
    };
  }
}

function saveLicense(userDataPath, token) {
  const licensePath = getLicensePath(userDataPath);

  fs.mkdirSync(userDataPath, {
    recursive: true,
  });

  fs.writeFileSync(
    licensePath,
    token.trim(),
    {
      encoding: 'utf8',
      mode: 0o600,
    },
  );
}

function loadLicense(userDataPath) {
  const licensePath = getLicensePath(userDataPath);

  if (!fs.existsSync(licensePath)) {
    return null;
  }

  try {
    return fs.readFileSync(
      licensePath,
      'utf8',
    ).trim();
  } catch (error) {
    console.error(
      '[License] Não foi possível ler a licença:',
      error.message,
    );

    return null;
  }
}

function removeLicense(userDataPath) {
  const licensePath = getLicensePath(userDataPath);

  try {
    if (fs.existsSync(licensePath)) {
      fs.unlinkSync(licensePath);
    }
  } catch (error) {
    console.error(
      '[License] Não foi possível remover a licença:',
      error.message,
    );
  }
}

function getLicenseStatus(userDataPath, publicKey) {
  const token = loadLicense(userDataPath);

  if (!token) {
    return {
      valid: false,
      activated: false,
      reason: 'Aplicativo ainda não ativado.',
      machineId: getMachineId(),
    };
  }

  const result = verifyLicenseToken(
    token,
    publicKey,
  );

  return {
    ...result,
    activated: result.valid,
    machineId: getMachineId(),
  };
}

module.exports = {
  PRODUCT_ID,
  LICENSE_VERSION,
  getMachineFingerprint,
  getMachineId,
  getLicensePath,
  verifyLicenseToken,
  saveLicense,
  loadLicense,
  removeLicense,
  getLicenseStatus,
};

