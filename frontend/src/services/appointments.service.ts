import { api } from './api';
import type {
  Appointment,
  CreateAppointmentPayload,
  FindAppointmentsParams,
  UpdateAppointmentPayload,
} from '../types/appointment';

export const appointmentsService = {
  async getAppointments(
    params?: FindAppointmentsParams,
  ): Promise<Appointment[]> {
    const query: Record<string, string> = {};

    if (params?.startDate && params.startDate.trim()) {
      query.startDate = params.startDate.trim();
    }

    if (params?.endDate && params.endDate.trim()) {
      query.endDate = params.endDate.trim();
    }

    if (params?.status) {
      query.status = params.status;
    }

    if (params?.patientName && params.patientName.trim()) {
      query.patientName = params.patientName.trim();
    }

    const response = await api.get<Appointment[]>('/appointments', {
      params: query,
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async getAppointment(id: number): Promise<Appointment> {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  async createAppointment(
    payload: CreateAppointmentPayload,
  ): Promise<Appointment> {
    const response = await api.post<Appointment>('/appointments', payload);
    return response.data;
  },

  async updateAppointment(
    id: number,
    payload: UpdateAppointmentPayload,
  ): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}`,
      payload,
    );
    return response.data;
  },

  async confirmAppointment(id: number): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/confirm`,
    );
    return response.data;
  },

  async cancelAppointment(id: number): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/cancel`,
    );
    return response.data;
  },

  async completeAppointment(id: number): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/complete`,
    );
    return response.data;
  },

  async markAppointmentAsNoShow(id: number): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/no-show`,
    );
    return response.data;
  },

  /**
   * Creates multiple appointments for a recurrence series sharing the same recurrenceId
   */
  async createRecurrenceSeries(
    basePayload: CreateAppointmentPayload,
    occurrences: Array<{ startAt: string; endAt: string }>,
  ): Promise<Appointment[]> {
    const created: Appointment[] = [];
    for (const occ of occurrences) {
      const app = await this.createAppointment({
        ...basePayload,
        startAt: occ.startAt,
        endAt: occ.endAt,
      });
      created.push(app);
    }
    return created;
  },

  /**
   * Cancels this and all future appointments of the same recurrence series
   */
  async cancelSeriesFuture(
    recurrenceId: string,
    fromDateIso: string,
    allAppointments: Appointment[],
  ): Promise<void> {
    const futureSessions = allAppointments.filter(
      (a) =>
        a.recurrenceId === recurrenceId &&
        a.startAt >= fromDateIso &&
        a.status === 'SCHEDULED',
    );

    for (const session of futureSessions) {
      await this.cancelAppointment(session.id);
    }
  },

  /**
   * Updates time for this and future appointments of the same series
   */
  async updateSeriesFutureTime(
    recurrenceId: string,
    fromDateIso: string,
    newStartTime: string, // HH:mm
    newEndTime: string, // HH:mm
    allAppointments: Appointment[],
  ): Promise<void> {
    const futureSessions = allAppointments.filter(
      (a) =>
        a.recurrenceId === recurrenceId &&
        a.startAt >= fromDateIso &&
        a.status === 'SCHEDULED',
    );

    for (const session of futureSessions) {
      // Extract the date part of the session
      const datePart = session.startAt.slice(0, 10);
      const safeTimeStart = `${datePart}T${newStartTime}:00`;
      const safeTimeEnd = `${datePart}T${newEndTime}:00`;
      const newStartAt = new Date(safeTimeStart).toISOString();
      const newEndAt = new Date(safeTimeEnd).toISOString();

      await this.updateAppointment(session.id, {
        startAt: newStartAt,
        endAt: newEndAt,
      });
    }
  },
};

