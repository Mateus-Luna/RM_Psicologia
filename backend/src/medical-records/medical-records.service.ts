import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { Prisma } from '../../generated/prisma/client';

import { CreateMedicalRecordEntryDto } from './dto/create-medical-record-entry.dto';
import { UpdateMedicalRecordEntryDto } from './dto/update-medical-record-entry.dto';
import { FindMedicalRecordEntriesDto } from './dto/find-medical-record-entries.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  private decryptEntry(entry: any) {
    return {
      ...entry,

      content: entry.content
        ? this.cryptoService.decrypt(entry.content)
        : entry.content,
    };
  }

  async create(
    patientId: number,
    createDto: CreateMedicalRecordEntryDto,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        isActive: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const entry =
      await this.prisma.medicalRecordEntry.create({
        data: {
          patientId,
          type: createDto.type,
          entryDate: new Date(createDto.entryDate),

          content: this.cryptoService.encrypt(
            createDto.content,
          ),
        },
      });

    return this.decryptEntry(entry);
  }

  async findAll(
    patientId: number,
    filters: FindMedicalRecordEntriesDto,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        isActive: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        'Paciente não encontrado.',
      );
    }

    const where: Prisma.MedicalRecordEntryWhereInput = {
      patientId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.entryDate = {
        ...(filters.startDate && {
          gte: new Date(filters.startDate),
        }),

        ...(filters.endDate && {
          lte: new Date(filters.endDate),
        }),
      };
    }

    const entries =
      await this.prisma.medicalRecordEntry.findMany({
        where,
        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

    let decryptedEntries = entries.map((entry) =>
      this.decryptEntry(entry),
    );

    if (filters.search) {
      const search = filters.search.toLowerCase();

      decryptedEntries = decryptedEntries.filter(
        (entry) =>
          entry.content
            ?.toLowerCase()
            .includes(search),
      );
    }

    return decryptedEntries;
  }

  async findOne(patientId: number, id: number) {
    const entry =
      await this.prisma.medicalRecordEntry.findFirst({
        where: {
          id,
          patientId,
        },
      });

    if (!entry) {
      throw new NotFoundException(
        'Registro de prontuário não encontrado.',
      );
    }

    return this.decryptEntry(entry);
  }

  async update(
    patientId: number,
    id: number,
    updateDto: UpdateMedicalRecordEntryDto,
  ) {
    await this.findOne(patientId, id);

    const entry =
      await this.prisma.medicalRecordEntry.update({
        where: {
          id,
        },
        data: {
          ...(updateDto.type !== undefined && {
            type: updateDto.type,
          }),

          ...(updateDto.entryDate !== undefined && {
            entryDate: new Date(updateDto.entryDate),
          }),

          ...(updateDto.content !== undefined && {
            content: this.cryptoService.encrypt(
              updateDto.content,
            ),
          }),
        },
      });

    return this.decryptEntry(entry);
  }

  async remove(patientId: number, id: number) {
    await this.findOne(patientId, id);

    return this.prisma.medicalRecordEntry.delete({
      where: {
        id,
      },
    });
  }
}