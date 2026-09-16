import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AppointmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        id: dto.patientId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException(
        'Appointment end time must be after start time',
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        startAt,
        endAt,
        confirmed: dto.confirmed ?? false,
        notes: dto.notes,
        recurrenceId: dto.recurrenceId,
      },
      include: {
        patient: true,
      },
    });

    return appointment;
  }

  async findAll(dto: FindAppointmentsDto) {
    const where: any = {};

    if (dto.startDate || dto.endDate) {
      where.startAt = {};

      if (dto.startDate) {
        where.startAt.gte = new Date(dto.startDate);
      }

      if (dto.endDate) {
        where.startAt.lte = new Date(dto.endDate);
      }
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.patientName) {
      where.patient = {
        name: {
          contains: dto.patientName,
        },
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: {
        id,
      },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(id: number, dto: UpdateAppointmentDto) {
    const existing = await this.prisma.appointment.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    const startAt = dto.startAt
      ? new Date(dto.startAt)
      : existing.startAt;

    const endAt = dto.endAt
      ? new Date(dto.endAt)
      : existing.endAt;

    if (endAt <= startAt) {
      throw new BadRequestException(
        'Appointment end time must be after start time',
      );
    }

    return this.prisma.appointment.update({
      where: {
        id,
      },
      data: {
        ...(dto.startAt && {
          startAt,
        }),

        ...(dto.endAt && {
          endAt,
        }),

        ...(dto.status !== undefined && {
          status: dto.status,
        }),

        ...(dto.confirmed !== undefined && {
          confirmed: dto.confirmed,
        }),

        ...(dto.notes !== undefined && {
          notes: dto.notes,
        }),

        ...(dto.recurrenceId !== undefined && {
          recurrenceId: dto.recurrenceId,
        }),
      },
      include: {
        patient: true,
      },
    });
  }

  async cancel(id: number) {
    return this.update(id, {
      status: AppointmentStatus.CANCELLED,
    });
  }

  async confirm(id: number) {
    return this.update(id, {
      confirmed: true,
    });
  }

  async complete(id: number) {
    return this.update(id, {
      status: AppointmentStatus.COMPLETED,
    });
  }

  async markAsNoShow(id: number) {
    return this.update(id, {
      status: AppointmentStatus.NO_SHOW,
    });
  }
}