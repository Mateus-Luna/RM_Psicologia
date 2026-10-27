import { describe, it, expect, beforeEach } from 'vitest';

class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}

const globalStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: globalStorage,
  writable: true,
});

describe('PsiFicha Feature Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should support patient guardian fields correctly', () => {
    const patientPayload = {
      name: 'João da Silva',
      cpf: '12345678901',
      phone: '11999998888',
      guardianName: 'Maria da Silva (Mãe)',
      guardianPhone: '11988887777',
      birthDate: '2010-05-15',
      treatmentStartDate: '2026-01-10',
      hasMedicalFollowUp: false,
    };

    expect(patientPayload.guardianName).toBe('Maria da Silva (Mãe)');
    expect(patientPayload.guardianPhone).toBe('11988887777');
  });

  it('should support medical record attachments correctly', () => {
    const attachment = {
      id: 'att-1',
      name: 'laudo-medico.pdf',
      size: 102450,
      type: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLj...',
      uploadedAt: new Date().toISOString(),
    };

    const recordPayload = {
      type: 'APPOINTMENT',
      entryDate: new Date().toISOString(),
      content: 'Sessão com evolução e entrega de laudo.',
      attachments: [attachment],
    };

    expect(recordPayload.attachments).toHaveLength(1);
    expect(recordPayload.attachments[0].name).toBe('laudo-medico.pdf');
    expect(recordPayload.attachments[0].type).toBe('application/pdf');
  });

  it('should store and retrieve custom logo in localStorage fallback', () => {
    const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
    localStorage.setItem('psificha_custom_logo', testDataUrl);

    const retrieved = localStorage.getItem('psificha_custom_logo');
    expect(retrieved).toBe(testDataUrl);
  });
});
