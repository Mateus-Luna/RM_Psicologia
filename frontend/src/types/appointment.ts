import type { Patient } from './patient';

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  COMPLETED: 'Realizado',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Faltou',
};

export interface Appointment {
  id: number;
  patientId: number;
  patient?: Patient;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  confirmed: boolean;
  notes?: string | null;
  recurrenceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentPayload {
  patientId: number;
  startAt: string;
  endAt: string;
  confirmed?: boolean;
  notes?: string;
  recurrenceId?: string;
}

export interface UpdateAppointmentPayload {
  startAt?: string;
  endAt?: string;
  status?: AppointmentStatus;
  confirmed?: boolean;
  notes?: string;
  recurrenceId?: string;
}

export interface FindAppointmentsParams {
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
  patientName?: string;
}

export type RecurrenceFrequency =
  | 'none'
  | 'weekly'
  | 'biweekly'
  | 'every_three_weeks'
  | 'monthly';

export const RecurrenceFrequencyLabels: Record<RecurrenceFrequency, string> = {
  none: 'Nenhuma (sessão avulsa)',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  every_three_weeks: 'A cada 3 semanas',
  monthly: 'Mensal',
};

export type SeriesEditScope = 'this_only' | 'this_and_future';
export type SeriesCancelScope = 'this_only' | 'this_and_future';

