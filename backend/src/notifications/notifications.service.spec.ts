import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const prismaMock = {
    patient: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('getTodayBirthdays', () => {
    it('should return patients whose birthday is today', async () => {
      const today = new Date();

      const birthdayPatient = {
        id: 1,
        name: 'João Silva',
        birthDate: new Date(
          Date.UTC(1998, today.getUTCMonth(), today.getUTCDate()),
        ),
      };

      prismaMock.patient.findMany.mockResolvedValue([
        birthdayPatient,
      ]);

      const result = await service.getTodayBirthdays();

      expect(result).toEqual([
        {
          id: 1,
          name: 'João Silva',
          birthDate: birthdayPatient.birthDate,
        },
      ]);

      expect(prismaMock.patient.findMany).toHaveBeenCalledWith({
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
    });

    it('should not return patients whose birthday is not today', async () => {
      const today = new Date();

      const birthdayPatient = {
        id: 1,
        name: 'João Silva',
        birthDate: new Date(
          Date.UTC(1998, today.getUTCMonth(), today.getUTCDate()),
        ),
      };

      const otherPatient = {
        id: 2,
        name: 'Maria Silva',
        birthDate: new Date(
          Date.UTC(2000, today.getUTCMonth(), today.getUTCDate() + 1),
        ),
      };

      prismaMock.patient.findMany.mockResolvedValue([
        birthdayPatient,
        otherPatient,
      ]);

      const result = await service.getTodayBirthdays();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        name: 'João Silva',
        birthDate: birthdayPatient.birthDate,
      });
    });

    it('should not return inactive patients', async () => {
      const today = new Date();

      const birthdayPatient = {
        id: 1,
        name: 'João Silva',
        birthDate: new Date(
          Date.UTC(1998, today.getUTCMonth(), today.getUTCDate()),
        ),
      };

      prismaMock.patient.findMany.mockResolvedValue([
        birthdayPatient,
      ]);

      const result = await service.getTodayBirthdays();

      expect(prismaMock.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
          },
        }),
      );

      expect(result).toEqual([
        {
          id: 1,
          name: 'João Silva',
          birthDate: birthdayPatient.birthDate,
        },
      ]);
    });

    it('should return an empty array when there are no birthdays today', async () => {
      prismaMock.patient.findMany.mockResolvedValue([]);

      const result = await service.getTodayBirthdays();

      expect(result).toEqual([]);
    });

    it('should return multiple patients when they share the same birthday', async () => {
      const today = new Date();

      const firstPatient = {
        id: 1,
        name: 'João Silva',
        birthDate: new Date(
          Date.UTC(1998, today.getUTCMonth(), today.getUTCDate()),
        ),
      };

      const secondPatient = {
        id: 2,
        name: 'Maria Souza',
        birthDate: new Date(
          Date.UTC(2001, today.getUTCMonth(), today.getUTCDate()),
        ),
      };

      prismaMock.patient.findMany.mockResolvedValue([
        firstPatient,
        secondPatient,
      ]);

      const result = await service.getTodayBirthdays();

      expect(result).toHaveLength(2);

      expect(result).toEqual([
        {
          id: 1,
          name: 'João Silva',
          birthDate: firstPatient.birthDate,
        },
        {
          id: 2,
          name: 'Maria Souza',
          birthDate: secondPatient.birthDate,
        },
      ]);
    });

    it('should return only the required patient fields', async () => {
      const today = new Date();

      const patient = {
        id: 1,
        name: 'João Silva',
        birthDate: new Date(
          Date.UTC(1998, today.getUTCMonth(), today.getUTCDate()),
        ),
      };

      prismaMock.patient.findMany.mockResolvedValue([patient]);

      const result = await service.getTodayBirthdays();

      expect(result[0]).toEqual({
        id: patient.id,
        name: patient.name,
        birthDate: patient.birthDate,
      });
    });
  });
});