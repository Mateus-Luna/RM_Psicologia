import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PatientsService } from './patients.service';

const prisma = {
  patient: {
    findMany: jest.fn<(args: unknown) => Promise<unknown>>(),
  },
};

const service = new PatientsService(prisma as never);

beforeEach(() => {
  prisma.patient.findMany.mockReset();
});

describe('findAll', () => {
  it('deve buscar pacientes por nome ou CPF', async () => {
    const patients = [
      {
        id: 1,
        name: 'João da Silva',
        cpf: '12345678900',
        medications: [],
      },
    ];

    prisma.patient.findMany.mockResolvedValue(patients);

    const result = await service.findAll({
      search: 'João',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: 'João',
            },
          },
          {
            cpf: {
              contains: 'João',
            },
          },
        ],
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
      orderBy: {
        name: 'asc',
      },
    });

    expect(result).toEqual(patients);
  });

  it('deve filtrar pacientes que possuem acompanhamento médico', async () => {
    prisma.patient.findMany.mockResolvedValue([]);

    await service.findAll({
      hasMedicalFollowUp: 'true',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          hasMedicalFollowUp: true,
        },
      }),
    );
  });

  it('deve filtrar pacientes que não possuem acompanhamento médico', async () => {
    prisma.patient.findMany.mockResolvedValue([]);

    await service.findAll({
      hasMedicalFollowUp: 'false',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          hasMedicalFollowUp: false,
        },
      }),
    );
  });

  it('deve filtrar pacientes que possuem pelo menos um medicamento ativo', async () => {
    prisma.patient.findMany.mockResolvedValue([]);

    await service.findAll({
      usesMedication: 'true',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          medications: {
            some: {
              isActive: true,
            },
          },
        },
      }),
    );
  });

  it('deve filtrar pacientes que não possuem medicamentos ativos', async () => {
    prisma.patient.findMany.mockResolvedValue([]);

    await service.findAll({
      usesMedication: 'false',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          medications: {
            none: {
              isActive: true,
            },
          },
        },
      }),
    );
  });

  it('deve filtrar por um medicamento específico', async () => {
    prisma.patient.findMany.mockResolvedValue([]);

    await service.findAll({
      medication: 'sertralina',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          medications: {
            some: {
              isActive: true,
              name: {
                contains: 'sertralina',
              },
            },
          },
        },
      }),
    );
  });

  it('deve retornar somente os medicamentos ativos dos pacientes', async () => {
    const patients = [
      {
        id: 1,
        name: 'João da Silva',
        medications: [
          {
            id: 1,
            name: 'Sertralina',
            isActive: true,
          },
          {
            id: 2,
            name: 'Quetiapina',
            isActive: true,
          },
        ],
      },
    ];

    prisma.patient.findMany.mockResolvedValue(patients);

    const result = await service.findAll({});

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: {
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
      orderBy: {
        name: 'asc',
      },
    });

    expect(result[0].medications).toHaveLength(2);
  });
});