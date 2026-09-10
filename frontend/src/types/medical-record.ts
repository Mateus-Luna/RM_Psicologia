export const MedicalRecordEntryType = {
  APPOINTMENT: 'APPOINTMENT',
  GENERAL_NOTE: 'GENERAL_NOTE',
} as const;

export type MedicalRecordEntryType =
  (typeof MedicalRecordEntryType)[keyof typeof MedicalRecordEntryType];

export interface MedicalRecordEntry {
  id: number;
  patientId: number;
  type: MedicalRecordEntryType;
  entryDate: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordEntryPayload {
  type: MedicalRecordEntryType;
  entryDate: string;
  content: string;
}

export interface UpdateMedicalRecordEntryPayload {
  type?: MedicalRecordEntryType;
  entryDate?: string;
  content?: string;
}

export interface FindMedicalRecordEntriesParams {
  search?: string;
  type?: MedicalRecordEntryType;
  startDate?: string;
  endDate?: string;
}
