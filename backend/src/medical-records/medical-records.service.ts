import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

import { CreateMedicalRecordEntryDto } from './dto/create-medical-record-entry.dto';
import { UpdateMedicalRecordEntryDto } from './dto/update-medical-record-entry.dto';
import { FindMedicalRecordEntriesDto } from './dto/find-medical-record-entries.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.medicalRecordEntry.create({
      data: {
        patientId,
        type: createDto.type,
        entryDate: new Date(createDto.entryDate),
        content: createDto.content,
      },
    });
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
      throw new NotFoundException('Paciente não encontrado.');
    }

    const where: Prisma.MedicalRecordEntryWhereInput = {
      patientId,
    };

    if (filters.search) {
      where.content = {
        contains: filters.search,
      };
    }

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

    return this.prisma.medicalRecordEntry.findMany({
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
  }

  async findOne(patientId: number, id: number) {
    const entry = await this.prisma.medicalRecordEntry.findFirst({
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

    return entry;
  }

  async update(
    patientId: number,
    id: number,
    updateDto: UpdateMedicalRecordEntryDto,
  ) {
    await this.findOne(patientId, id);

    return this.prisma.medicalRecordEntry.update({
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
          content: updateDto.content,
        }),
      },
    });
  }
}