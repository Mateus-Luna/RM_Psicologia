import { api } from './api';
import type {
  CreateMedicalRecordEntryPayload,
  FindMedicalRecordEntriesParams,
  MedicalRecordEntry,
  UpdateMedicalRecordEntryPayload,
} from '../types/medical-record';

export const medicalRecordsService = {
  async getMedicalRecordEntries(
    patientId: number,
    filters?: FindMedicalRecordEntriesParams,
  ): Promise<MedicalRecordEntry[]> {
    const params: Record<string, string> = {};

    if (filters?.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }

    if (filters?.type) {
      params.type = filters.type;
    }

    if (filters?.startDate && filters.startDate.trim()) {
      params.startDate = filters.startDate.trim();
    }

    if (filters?.endDate && filters.endDate.trim()) {
      params.endDate = filters.endDate.trim();
    }

    const response = await api.get<MedicalRecordEntry[]>(
      `/patients/${patientId}/medical-records`,
      { params },
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async getMedicalRecordEntry(
    patientId: number,
    id: number,
  ): Promise<MedicalRecordEntry> {
    const response = await api.get<MedicalRecordEntry>(
      `/patients/${patientId}/medical-records/${id}`,
    );
    return response.data;
  },

  async createMedicalRecordEntry(
    patientId: number,
    payload: CreateMedicalRecordEntryPayload,
  ): Promise<MedicalRecordEntry> {
    const response = await api.post<MedicalRecordEntry>(
      `/patients/${patientId}/medical-records`,
      payload,
    );
    return response.data;
  },

  async updateMedicalRecordEntry(
    patientId: number,
    id: number,
    payload: UpdateMedicalRecordEntryPayload,
  ): Promise<MedicalRecordEntry> {
    const response = await api.patch<MedicalRecordEntry>(
      `/patients/${patientId}/medical-records/${id}`,
      payload,
    );
    return response.data;
  },

  async deleteMedicalRecordEntry(
    patientId: number,
    id: number,
  ): Promise<void> {
    await api.delete(`/patients/${patientId}/medical-records/${id}`);
  },
};
