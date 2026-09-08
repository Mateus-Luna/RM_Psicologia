export interface PatientMedication {
  id: number;
  name: string;
  notes?: string | null;
  isActive: boolean;
  startedAt: string;
  endedAt?: string | null;
  patientId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: number;
  name: string;
  cpf?: string | null;
  phone: string;
  birthDate: string;
  treatmentStartDate: string;
  diagnosticHypothesis?: string | null;
  hasMedicalFollowUp: boolean;
  doctorName?: string | null;
  generalNotes?: string | null;
  isActive: boolean;
  medications: PatientMedication[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientMedicationItem {
  name: string;
  notes?: string;
  startedAt?: string;
}

export interface UpdatePatientMedicationItem {
  id?: number;
  name: string;
  notes?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface CreatePatientPayload {
  name: string;
  cpf?: string;
  phone: string;
  birthDate: string;
  treatmentStartDate: string;
  diagnosticHypothesis?: string;
  hasMedicalFollowUp: boolean;
  doctorName?: string;
  generalNotes?: string;
  medications?: CreatePatientMedicationItem[];
}

export interface UpdatePatientPayload {
  name?: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  treatmentStartDate?: string;
  diagnosticHypothesis?: string;
  hasMedicalFollowUp?: boolean;
  doctorName?: string;
  generalNotes?: string;
  medications?: UpdatePatientMedicationItem[];
}

export interface PatientFilters {
  search?: string;
  hasMedicalFollowUp?: string; // 'true' | 'false' | ''
  usesMedication?: string;     // 'true' | 'false' | ''
  medication?: string;
}
