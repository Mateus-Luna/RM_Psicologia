import { api } from './api';
import type {
  CreatePatientPayload,
  Patient,
  PatientFilters,
  UpdatePatientPayload,
} from '../types/patient';

export const patientsService = {
  async getPatients(filters?: PatientFilters): Promise<Patient[]> {
    const params: Record<string, string> = {};

    if (filters?.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }

    if (
      filters?.hasMedicalFollowUp === 'true' ||
      filters?.hasMedicalFollowUp === 'false'
    ) {
      params.hasMedicalFollowUp = filters.hasMedicalFollowUp;
    }

    if (
      filters?.usesMedication === 'true' ||
      filters?.usesMedication === 'false'
    ) {
      params.usesMedication = filters.usesMedication;
    }

    if (filters?.medication && filters.medication.trim()) {
      params.medication = filters.medication.trim();
    }

    const response = await api.get<Patient[]>('/patients', { params });
    return response.data;
  },

  async getPatient(id: number): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  async createPatient(payload: CreatePatientPayload): Promise<Patient> {
    const response = await api.post<Patient>('/patients', payload);
    return response.data;
  },

  async updatePatient(
    id: number,
    payload: UpdatePatientPayload,
  ): Promise<Patient> {
    const response = await api.patch<Patient>(`/patients/${id}`, payload);
    return response.data;
  },

  async deletePatient(id: number): Promise<Patient> {
    const response = await api.delete<Patient>(`/patients/${id}`);
    return response.data;
  },
};
