import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getTodayBirthdays() {
    const today = new Date();

    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const patients = await this.prisma.patient.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
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
        name: this.cryptoService.decrypt(patient.name),
        birthDate: patient.birthDate,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR'),
      );
  }
}