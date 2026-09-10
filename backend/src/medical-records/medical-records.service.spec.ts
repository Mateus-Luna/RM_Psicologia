import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MedicalRecordsService } from './medical-records.service';

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      patient: {
        findFirst: jest.fn(),
      },
      medicalRecordEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new MedicalRecordsService(prisma);
  });

  describe('create', () => {
    it('should create a medical record entry for an existing patient', async () => {
      const patientId = 1;

      prisma.patient.findFirst.mockResolvedValue({
        id: patientId,
        isActive: true,
      });

      const createdEntry = {
        id: 10,
        patientId,
        type: 'APPOINTMENT',
        entryDate: new Date('2026-09-10T14:00:00.000Z'),
        content: 'Paciente apresentou melhora.',
      };

      prisma.medicalRecordEntry.create.mockResolvedValue(createdEntry);

      const result = await service.create(patientId, {
        type: 'APPOINTMENT' as any,
        entryDate: '2026-09-10T14:00:00.000Z',
        content: 'Paciente apresentou melhora.',
      });

      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: {
          id: patientId,
          isActive: true,
        },
      });

      expect(prisma.medicalRecordEntry.create).toHaveBeenCalledWith({
        data: {
          patientId,
          type: 'APPOINTMENT',
          entryDate: new Date('2026-09-10T14:00:00.000Z'),
          content: 'Paciente apresentou melhora.',
        },
      });

      expect(result).toEqual(createdEntry);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create(999, {
          type: 'GENERAL_NOTE' as any,
          entryDate: '2026-09-10T14:00:00.000Z',
          content: 'Anotação.',
        }),
      ).rejects.toThrow(
        new NotFoundException('Paciente não encontrado.'),
      );

      expect(prisma.medicalRecordEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      prisma.patient.findFirst.mockResolvedValue({
        id: 1,
        isActive: true,
      });

      prisma.medicalRecordEntry.findMany.mockResolvedValue([]);
    });

    it('should return medical record entries for a patient', async () => {
      const entries = [
        {
          id: 2,
          patientId: 1,
          type: 'APPOINTMENT',
          entryDate: new Date('2026-09-20T14:00:00.000Z'),
          content: 'Registro mais recente.',
        },
        {
          id: 1,
          patientId: 1,
          type: 'GENERAL_NOTE',
          entryDate: new Date('2026-09-10T14:00:00.000Z'),
          content: 'Registro anterior.',
        },
      ];

      prisma.medicalRecordEntry.findMany.mockResolvedValue(entries);

      const result = await service.findAll(1, {});

      expect(prisma.medicalRecordEntry.findMany).toHaveBeenCalledWith({
        where: {
          patientId: 1,
        },
        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

      expect(result).toEqual(entries);
    });

    it('should filter entries by content search', async () => {
      await service.findAll(1, {
        search: 'ansiedade',
      });

      expect(prisma.medicalRecordEntry.findMany).toHaveBeenCalledWith({
        where: {
          patientId: 1,
          content: {
            contains: 'ansiedade',
          },
        },
        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });
    });

    it('should filter entries by type', async () => {
      await service.findAll(1, {
        type: 'APPOINTMENT' as any,
      });

      expect(prisma.medicalRecordEntry.findMany).toHaveBeenCalledWith({
        where: {
          patientId: 1,
          type: 'APPOINTMENT',
        },
        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });
    });

    it('should filter entries by start date', async () => {
      await service.findAll(1, {
        startDate: '2026-09-01T00:00:00.000Z',
      });

      expect(prisma.medicalRecordEntry.findMany).toHaveBeenCalledWith({
        where: {
          patientId: 1,
          entryDate: {
            gte: new Date('2026-09-01T00:00:00.000Z'),
          },
        },
        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });
    });

    it('should filter entries by end date', async () => {
      await service.findAll(1, {
        endDate: '2026-09-30T23:59:59.999Z',
      });

      expect(prisma.medicalRecordEntry.findMany).toHaveBeenCalledWith({
        where: {
          patientId: 1,
          entryDate: {
            lte: new Date('2026-09-30T23:59:59.999Z'),
          },
        },
        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });
    });

    it('should combine multiple filters', async () => {
      await service.findAll(1, {
        search: 'ansiedade',
        type: 'APPOINTMENT' as any,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.999Z',
      });

      expect(prisma.medicalRecordEntry.findMany).toHaveBeenCalledWith({
        where: {
          patientId: 1,
          content: {
            contains: 'ansiedade',
          },
          type: 'APPOINTMENT',
          entryDate: {
            gte: new Date('2026-09-01T00:00:00.000Z'),
            lte: new Date('2026-09-30T23:59:59.999Z'),
          },
        },
        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll(999, {}),
      ).rejects.toThrow(
        new NotFoundException('Paciente não encontrado.'),
      );

      expect(prisma.medicalRecordEntry.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a medical record entry belonging to the patient', async () => {
      const entry = {
        id: 10,
        patientId: 1,
        type: 'APPOINTMENT',
        entryDate: new Date('2026-09-10T14:00:00.000Z'),
        content: 'Registro clínico.',
      };

      prisma.medicalRecordEntry.findFirst.mockResolvedValue(entry);

      const result = await service.findOne(1, 10);

      expect(prisma.medicalRecordEntry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 10,
          patientId: 1,
        },
      });

      expect(result).toEqual(entry);
    });

    it('should throw NotFoundException when entry does not exist', async () => {
      prisma.medicalRecordEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(1, 999),
      ).rejects.toThrow(
        new NotFoundException(
          'Registro de prontuário não encontrado.',
        ),
      );
    });

    it('should not allow access to an entry belonging to another patient', async () => {
      prisma.medicalRecordEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(1, 20),
      ).rejects.toThrow(
        new NotFoundException(
          'Registro de prontuário não encontrado.',
        ),
      );

      expect(prisma.medicalRecordEntry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 20,
          patientId: 1,
        },
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.medicalRecordEntry.findFirst.mockResolvedValue({
        id: 10,
        patientId: 1,
        type: 'APPOINTMENT',
        entryDate: new Date('2026-09-10T14:00:00.000Z'),
        content: 'Conteúdo antigo.',
      });

      prisma.medicalRecordEntry.update.mockResolvedValue({
        id: 10,
        patientId: 1,
        type: 'APPOINTMENT',
        entryDate: new Date('2026-09-10T14:00:00.000Z'),
        content: 'Conteúdo atualizado.',
      });
    });

    it('should update the content', async () => {
      const result = await service.update(1, 10, {
        content: 'Conteúdo atualizado.',
      });

      expect(prisma.medicalRecordEntry.update).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
        data: {
          content: 'Conteúdo atualizado.',
        },
      });

      expect(result.content).toBe('Conteúdo atualizado.');
    });

    it('should update the type', async () => {
      await service.update(1, 10, {
        type: 'GENERAL_NOTE' as any,
      });

      expect(prisma.medicalRecordEntry.update).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
        data: {
          type: 'GENERAL_NOTE',
        },
      });
    });

    it('should update the entry date', async () => {
      await service.update(1, 10, {
        entryDate: '2026-09-15T14:00:00.000Z',
      });

      expect(prisma.medicalRecordEntry.update).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
        data: {
          entryDate: new Date('2026-09-15T14:00:00.000Z'),
        },
      });
    });

    it('should support partial updates', async () => {
      await service.update(1, 10, {
        content: 'Somente o conteúdo mudou.',
      });

      expect(prisma.medicalRecordEntry.update).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
        data: {
          content: 'Somente o conteúdo mudou.',
        },
      });
    });

    it('should throw NotFoundException when entry does not exist', async () => {
      prisma.medicalRecordEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.update(1, 999, {
          content: 'Novo conteúdo.',
        }),
      ).rejects.toThrow(
        new NotFoundException(
          'Registro de prontuário não encontrado.',
        ),
      );

      expect(prisma.medicalRecordEntry.update).not.toHaveBeenCalled();
    });

    it('should not update an entry belonging to another patient', async () => {
      prisma.medicalRecordEntry.findFirst.mockResolvedValue(null);

      await expect(
        service.update(1, 20, {
          content: 'Tentativa de alteração.',
        }),
      ).rejects.toThrow(
        new NotFoundException(
          'Registro de prontuário não encontrado.',
        ),
      );

      expect(prisma.medicalRecordEntry.update).not.toHaveBeenCalled();
    });
  });
});