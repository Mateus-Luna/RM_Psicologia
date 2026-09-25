import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FindPatientsDto } from './dto/find-patients.dto';

import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  private normalizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private decryptMedication(medication: any) {
    return {
      ...medication,

      name: medication.name
        ? this.cryptoService.decrypt(medication.name)
        : medication.name,

      notes: medication.notes
        ? this.cryptoService.decrypt(medication.notes)
        : medication.notes,
    };
  }

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
        ? this.cryptoService.decrypt(patient.generalNotes)
        : patient.generalNotes,

      medications: patient.medications
        ? patient.medications
            .map((medication: any) =>
              this.decryptMedication(medication),
            )
            .sort((a: any, b: any) =>
              a.name.localeCompare(b.name, 'pt-BR'),
            )
        : patient.medications,
    };
  }

  async create(createPatientDto: CreatePatientDto) {
    const {
      medications,
      birthDate,
      treatmentStartDate,
      cpf,
      name,
      phone,
      diagnosticHypothesis,
      doctorName,
      generalNotes,
      ...patientData
    } = createPatientDto;

    const normalizedCpf = cpf
      ? this.normalizeCpf(cpf)
      : undefined;

    try {
      const patient = await this.prisma.patient.create({
        data: {
          ...patientData,

          name: this.cryptoService.encrypt(name),

          cpf: normalizedCpf
            ? this.cryptoService.encrypt(normalizedCpf)
            : undefined,

          cpfHash: normalizedCpf
            ? this.cryptoService.hash(normalizedCpf)
            : undefined,

          phone: this.cryptoService.encrypt(phone),

          diagnosticHypothesis:
            diagnosticHypothesis !== undefined &&
            diagnosticHypothesis !== null
              ? this.cryptoService.encrypt(
                  diagnosticHypothesis,
                )
              : undefined,

          doctorName:
            doctorName !== undefined &&
            doctorName !== null
              ? this.cryptoService.encrypt(doctorName)
              : undefined,

          generalNotes:
            generalNotes !== undefined &&
            generalNotes !== null
              ? this.cryptoService.encrypt(generalNotes)
              : undefined,

          birthDate: new Date(birthDate),
          treatmentStartDate: new Date(treatmentStartDate),

          medications: medications?.length
            ? {
                create: medications.map((medication) => ({
                  name: this.cryptoService.encrypt(
                    medication.name,
                  ),

                  notes:
                    medication.notes !== undefined &&
                    medication.notes !== null
                      ? this.cryptoService.encrypt(
                          medication.notes,
                        )
                      : undefined,

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

      return this.decryptPatient(patient);
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

    const patients = await this.prisma.patient.findMany({
      where,
      include: {
        medications: {
          where: {
            isActive: true,
          },
        },
      },
    });

    let decryptedPatients = patients.map((patient) =>
      this.decryptPatient(patient),
    );

    if (filters.search) {
      const search = filters.search.toLowerCase();
      const normalizedSearch = this.normalizeCpf(search);

      decryptedPatients = decryptedPatients.filter(
        (patient) => {
          const name =
            patient.name?.toLowerCase() ?? '';

          const cpf = patient.cpf ?? '';

          return (
            name.includes(search) ||
            cpf.includes(normalizedSearch)
          );
        },
      );
    }

    if (filters.medication) {
      const medicationSearch =
        filters.medication.toLowerCase();

      decryptedPatients = decryptedPatients.filter(
        (patient) =>
          patient.medications?.some(
            (medication: any) =>
              medication.isActive &&
              medication.name
                ?.toLowerCase()
                .includes(medicationSearch),
          ),
      );
    }

    decryptedPatients.sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR'),
    );

    return decryptedPatients;
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
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(
        'Paciente não encontrado.',
      );
    }

    return this.decryptPatient(patient);
  }

  async update(
    id: number,
    updatePatientDto: UpdatePatientDto,
  ) {
    const {
      medications,
      birthDate,
      treatmentStartDate,
      cpf,
      name,
      phone,
      diagnosticHypothesis,
      doctorName,
      generalNotes,
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
      throw new NotFoundException(
        'Paciente não encontrado.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const patientUpdateData: Prisma.PatientUpdateInput = {
          ...patientData,

          ...(name !== undefined && {
            name: this.cryptoService.encrypt(name),
          }),

          ...(cpf !== undefined && {
            cpf: cpf
              ? this.cryptoService.encrypt(
                  this.normalizeCpf(cpf),
                )
              : null,

            cpfHash: cpf
              ? this.cryptoService.hash(
                  this.normalizeCpf(cpf),
                )
              : null,
          }),

          ...(phone !== undefined && {
            phone: this.cryptoService.encrypt(phone),
          }),

          ...(diagnosticHypothesis !== undefined && {
            diagnosticHypothesis:
              diagnosticHypothesis
                ? this.cryptoService.encrypt(
                    diagnosticHypothesis,
                  )
                : null,
          }),

          ...(doctorName !== undefined && {
            doctorName: doctorName
              ? this.cryptoService.encrypt(
                  doctorName,
                )
              : null,
          }),

          ...(generalNotes !== undefined && {
            generalNotes: generalNotes
              ? this.cryptoService.encrypt(
                  generalNotes,
                )
              : null,
          }),

          ...(birthDate !== undefined && {
            birthDate: new Date(birthDate),
          }),

          ...(treatmentStartDate !== undefined && {
            treatmentStartDate: new Date(
              treatmentStartDate,
            ),
          }),
        };

        await tx.patient.update({
          where: {
            id,
          },
          data: patientUpdateData,
        });

        if (medications !== undefined) {
          const incomingIds = medications
            .filter(
              (medication) =>
                medication.id !== undefined,
            )
            .map(
              (medication) =>
                medication.id as number,
            );

          const activeMedications =
            patient.medications.filter(
              (medication) =>
                medication.isActive,
            );

          for (const medication of activeMedications) {
            if (
              !incomingIds.includes(
                medication.id,
              )
            ) {
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
                  name: this.cryptoService.encrypt(
                    medication.name,
                  ),

                  notes:
                    medication.notes !== undefined &&
                    medication.notes !== null
                      ? this.cryptoService.encrypt(
                          medication.notes,
                        )
                      : null,

                  ...(medication.startedAt !==
                    undefined && {
                    startedAt: new Date(
                      medication.startedAt,
                    ),
                  }),

                  ...(medication.endedAt !==
                    undefined && {
                    endedAt: new Date(
                      medication.endedAt,
                    ),
                  }),

                  isActive: true,
                  endedAt: null,
                },
              });
            } else {
              await tx.patientMedication.create({
                data: {
                  patientId: id,

                  name: this.cryptoService.encrypt(
                    medication.name,
                  ),

                  notes:
                    medication.notes !== undefined &&
                    medication.notes !== null
                      ? this.cryptoService.encrypt(
                          medication.notes,
                        )
                      : null,

                  startedAt:
                    medication.startedAt
                      ? new Date(
                          medication.startedAt,
                        )
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
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
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