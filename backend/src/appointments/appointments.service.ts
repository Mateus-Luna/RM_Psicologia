import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AppointmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  private decryptPatient(patient: any) {
    return {
      ...patient,

      name: patient.name
        ? this.cryptoService.decrypt(patient.name)
        : patient.name,

      cpf: patient.cpf
        ? this.cryptoService.decrypt(patient.cpf)
        : patient.cpf,

      phone: patient.phone
        ? this.cryptoService.decrypt(patient.phone)
        : patient.phone,

      diagnosticHypothesis:
        patient.diagnosticHypothesis
          ? this.cryptoService.decrypt(
              patient.diagnosticHypothesis,
            )
          : patient.diagnosticHypothesis,

      doctorName: patient.doctorName
        ? this.cryptoService.decrypt(patient.doctorName)
        : patient.doctorName,

      generalNotes: patient.generalNotes
        ? this.cryptoService.decrypt(
            patient.generalNotes,
          )
        : patient.generalNotes,
    };
  }

  private decryptAppointment(appointment: any) {
    return {
      ...appointment,

      notes: appointment.notes
        ? this.cryptoService.decrypt(
            appointment.notes,
          )
        : appointment.notes,

      patient: appointment.patient
        ? this.decryptPatient(appointment.patient)
        : appointment.patient,
    };
  }

  async create(dto: CreateAppointmentDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
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

    const appointment =
      await this.prisma.appointment.create({
        data: {
          patientId: dto.patientId,
          startAt,
          endAt,
          confirmed: dto.confirmed ?? false,

          notes: dto.notes
            ? this.cryptoService.encrypt(dto.notes)
            : dto.notes,

          recurrenceId: dto.recurrenceId,
        },

        include: {
          patient: true,
        },
      });

    return this.decryptAppointment(appointment);
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

    const appointments =
      await this.prisma.appointment.findMany({
        where,
        include: {
          patient: true,
        },
        orderBy: {
          startAt: 'asc',
        },
      });

    const decryptedAppointments =
      appointments.map((appointment) =>
        this.decryptAppointment(appointment),
      );

    if (dto.patientName) {
      const search = dto.patientName.toLowerCase();

      return decryptedAppointments.filter(
        (appointment) =>
          appointment.patient?.name
            ?.toLowerCase()
            .includes(search),
      );
    }

    return decryptedAppointments;
  }

  async findOne(id: number) {
    const appointment =
      await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: true,
        },
      });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found',
      );
    }

    return this.decryptAppointment(appointment);
  }

  async update(
    id: number,
    dto: UpdateAppointmentDto,
  ) {
    const existing =
      await this.prisma.appointment.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(
        'Appointment not found',
      );
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

    const appointment =
      await this.prisma.appointment.update({
        where: { id },

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
            notes: dto.notes
              ? this.cryptoService.encrypt(
                  dto.notes,
                )
              : null,
          }),

          ...(dto.recurrenceId !== undefined && {
            recurrenceId: dto.recurrenceId,
          }),
        },

        include: {
          patient: true,
        },
      });

    return this.decryptAppointment(appointment);
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