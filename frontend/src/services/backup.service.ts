import axios from 'axios';
import { api } from './api';
import type { RestoreBackupResponse } from '../types/backup';

export async function extractApiErrorMessage(
  err: unknown,
  fallbackMessage: string,
): Promise<string> {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const parsed = JSON.parse(text);
        if (parsed.message) {
          return Array.isArray(parsed.message)
            ? parsed.message.join(', ')
            : String(parsed.message);
        }
      } catch {
        // Payload is not JSON
      }
    } else if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as { message: unknown }).message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
  } else if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallbackMessage;
}

export const backupService = {
  async downloadBackup(): Promise<{
  filename: string;
  canceled: boolean;
}> {
  const response = await api.get('/backup', {
    responseType: 'arraybuffer',
  });

  let filename = 'PsiFicha-Backup.db';

  const disposition =
    response.headers?.['content-disposition'];

  if (disposition && typeof disposition === 'string') {
    const match = disposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
    );

    if (match && match[1]) {
      filename = match[1]
        .replace(/['"]/g, '')
        .trim();
    }
  }

  if (!window.backupAPI) {
    throw new Error(
      'A funcionalidade de salvamento de backup do aplicativo não está disponível.',
    );
  }

  const result = await window.backupAPI.saveBackup(
    response.data,
    filename,
  );

  if (result.canceled) {
    return {
      filename,
      canceled: true,
    };
  }

  if (!result.success) {
    throw new Error(
      result.error ||
        'Não foi possível salvar o backup.',
    );
  }

  return {
    filename,
    canceled: false,
  };
},

  async restoreBackup(file: File): Promise<RestoreBackupResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<RestoreBackupResponse>(
      '/backup/restore',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },
};
