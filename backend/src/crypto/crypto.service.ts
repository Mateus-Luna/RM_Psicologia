import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12;
  private readonly authTagLength = 16;
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is not configured.',
      );
    }

    this.key = createHash('sha256')
      .update(encryptionKey, 'utf8')
      .digest();
  }

  encrypt(value: string): string {
    if (!value) {
      return value;
    }

    const iv = randomBytes(this.ivLength);

    const cipher = createCipheriv(
      this.algorithm,
      this.key,
      iv,
      {
        authTagLength: this.authTagLength,
      },
    );

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join('.');
  }

  decrypt(value: string): string {
    if (!value) {
      return value;
    }

    const parts = value.split('.');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format.');
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      iv,
      {
        authTagLength: this.authTagLength,
      },
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  hash(value: string): string {
    return createHmac('sha256', this.key)
      .update(value, 'utf8')
      .digest('hex');
  }
}