import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayBirthdays() {
    const today = new Date();

    const currentMonth = today.getUTCMonth();
    const currentDay = today.getUTCDate();

    const patients = await this.prisma.patient.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return patients
      .filter((patient) => {
        const birthDate = new Date(patient.birthDate);

        return (
          birthDate.getUTCMonth() === currentMonth &&
          birthDate.getUTCDate() === currentDay
        );
      })
      .map((patient) => ({
        id: patient.id,
        name: patient.name,
        birthDate: patient.birthDate,
      }));
  }
}