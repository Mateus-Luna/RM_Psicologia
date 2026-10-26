export const MedicalRecordEntryType = {
  APPOINTMENT: 'APPOINTMENT',
  GENERAL_NOTE: 'GENERAL_NOTE',
} as const;

export type MedicalRecordEntryType =
  (typeof MedicalRecordEntryType)[keyof typeof MedicalRecordEntryType];

export interface MedicalRecordAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface MedicalRecordEntry {
  id: number;
  patientId: number;
  type: MedicalRecordEntryType;
  entryDate: string;
  content: string;
  attachments?: MedicalRecordAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordEntryPayload {
  type: MedicalRecordEntryType;
  entryDate: string;
  content: string;
  attachments?: MedicalRecordAttachment[];
}

export interface UpdateMedicalRecordEntryPayload {
  type?: MedicalRecordEntryType;
  entryDate?: string;
  content?: string;
  attachments?: MedicalRecordAttachment[];
}

export interface FindMedicalRecordEntriesParams {
  search?: string;
  type?: MedicalRecordEntryType;
  startDate?: string;
  endDate?: string;
}
