import { api } from './api';
import type { BirthdayNotification } from '../types/notification';

export const notificationsService = {
  async getTodayBirthdays(): Promise<BirthdayNotification[]> {
    const response = await api.get<BirthdayNotification[]>(
      '/notifications/birthdays/today',
    );
    return response.data;
  },
};
