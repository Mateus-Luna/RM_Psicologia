import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FindPatientsDto } from './dto/find-patients.dto';
import { Prisma } from '../../generated/prisma/client';
@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

 async create(createPatientDto: CreatePatientDto) {
  const {
    medications,
    birthDate,
    treatmentStartDate,
    ...patientData
  } = createPatientDto;

  try {
    return await this.prisma.patient.create({
      data: {
        ...patientData,

        birthDate: new Date(birthDate),
        treatmentStartDate: new Date(treatmentStartDate),

        medications: medications?.length
          ? {
              create: medications.map((medication) => ({
                name: medication.name,
                notes: medication.notes,
                startedAt: medication.startedAt
                  ? new Date(medication.startedAt)
                  : new Date(),
              })),
            }
          : undefined,
      },

      include: {
        medications: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Já existe um paciente cadastrado com este CPF.',
      );
    }

    throw error;
  }
}

  async findAll(filters: FindPatientsDto) {
  const where: Prisma.PatientWhereInput = {
    isActive: true,
  };

  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
        },
      },
      {
        cpf: {
          contains: filters.search,
        },
      },
    ];
  }

  if (filters.hasMedicalFollowUp !== undefined) {
    where.hasMedicalFollowUp =
      filters.hasMedicalFollowUp === 'true';
  }

  if (filters.usesMedication !== undefined) {
    if (filters.usesMedication === 'true') {
      where.medications = {
        some: {
          isActive: true,
        },
      };
    } else {
      where.medications = {
        none: {
          isActive: true,
        },
      };
    }
  }

  if (filters.medication) {
    where.medications = {
      some: {
        isActive: true,
        name: {
          contains: filters.medication,
        },
      },
    };
  }

  return this.prisma.patient.findMany({
    where,
    include: {
      medications: {
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

  async findOne(id: number) {
  const patient = await this.prisma.patient.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: {
      medications: {
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  });

  if (!patient) {
    throw new NotFoundException('Paciente não encontrado.');
  }

  return patient;
}

  async update(id: number, updatePatientDto: UpdatePatientDto) {
  const {
    medications,
    birthDate,
    treatmentStartDate,
    ...patientData
  } = updatePatientDto;

  const patient = await this.prisma.patient.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: {
      medications: true,
    },
  });

  if (!patient) {
    throw new NotFoundException('Paciente não encontrado.');
  }

  try {
    await this.prisma.$transaction(async (tx) => {
      await tx.patient.update({
        where: {
          id,
        },
        data: {
          ...patientData,

          ...(birthDate !== undefined && {
            birthDate: new Date(birthDate),
          }),

          ...(treatmentStartDate !== undefined && {
            treatmentStartDate: new Date(treatmentStartDate),
          }),
        },
      });

      if (medications !== undefined) {
        const incomingIds = medications
          .filter((medication) => medication.id !== undefined)
          .map((medication) => medication.id as number);

        const activeMedications = patient.medications.filter(
          (medication) => medication.isActive,
        );

        for (const medication of activeMedications) {
          if (!incomingIds.includes(medication.id)) {
            await tx.patientMedication.update({
              where: {
                id: medication.id,
              },
              data: {
                isActive: false,
                endedAt: new Date(),
              },
            });
          }
        }

        for (const medication of medications) {
          if (medication.id !== undefined) {
            await tx.patientMedication.update({
              where: {
                id: medication.id,
              },
              data: {
                name: medication.name,
                notes: medication.notes,

                ...(medication.startedAt !== undefined && {
                  startedAt: new Date(medication.startedAt),
                }),

                ...(medication.endedAt !== undefined && {
                  endedAt: new Date(medication.endedAt),
                }),

                isActive: true,
                endedAt: null,
              },
            });
          } else {
            await tx.patientMedication.create({
              data: {
                patientId: id,
                name: medication.name,
                notes: medication.notes,
                startedAt: medication.startedAt
                  ? new Date(medication.startedAt)
                  : new Date(),
                isActive: true,
              },
            });
          }
        }
      }
    });

    return this.findOne(id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Já existe um paciente cadastrado com este CPF.',
      );
    }

    throw error;
  }
}

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.patient.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }
}