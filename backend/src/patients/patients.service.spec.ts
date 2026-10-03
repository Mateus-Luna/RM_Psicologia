import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { NotFoundException } from '@nestjs/common';

import { PatientsService } from './patients.service';

const prisma = {
  patient: {
    findMany: jest.fn<(args: unknown) => Promise<unknown>>(),
    findFirst: jest.fn<(args: unknown) => Promise<unknown>>(),
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    update: jest.fn<(args: unknown) => Promise<unknown>>(),
  },
};

const cryptoService = {
  decrypt: jest.fn((value: string | null | undefined) => value),
};

const service = new PatientsService(
  prisma as never,
  cryptoService as never,
);

beforeEach(() => {
  prisma.patient.findMany.mockReset();
  prisma.patient.findFirst.mockReset();
  prisma.patient.findUnique.mockReset();
  prisma.patient.update.mockReset();

  cryptoService.decrypt.mockClear();
});

describe('findAll', () => {
  it('deve buscar pacientes por nome ou CPF', async () => {
    const patients = [
      {
        id: 1,
        name: 'João da Silva',
        cpf: '12345678900',
        phone: '83999999999',
        diagnosticHypothesis: null,
        doctorName: null,
        generalNotes: null,
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
      },
      include: {
        medications: {
          where: {
            isActive: true,
          },
        },
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

  it('deve processar o filtro por medicamento específico', async () => {
    prisma.patient.findMany.mockResolvedValue([]);

    await service.findAll({
      medication: 'sertralina',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
        },
      }),
    );
  });

  it('deve retornar somente os medicamentos ativos dos pacientes', async () => {
    const patients = [
      {
        id: 1,
        name: 'João da Silva',
        cpf: '12345678900',
        phone: '83999999999',
        diagnosticHypothesis: null,
        doctorName: null,
        generalNotes: null,
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
        },
      },
    });

    expect(result[0].medications).toHaveLength(2);
  });
});

describe('findInactive', () => {
  it('deve buscar somente pacientes inativos', async () => {
    const patients = [
      {
        id: 1,
        name: 'João da Silva',
        cpf: '12345678900',
        phone: '83999999999',
        diagnosticHypothesis: null,
        doctorName: null,
        generalNotes: null,
        isActive: false,
        medications: [],
      },
    ];

    prisma.patient.findMany.mockResolvedValue(patients);

    const result = await service.findInactive();

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: {
        isActive: false,
      },
      include: {
        medications: {
          where: {
            isActive: true,
          },
        },
      },
    });

    expect(result).toEqual(patients);
  });

  it('deve retornar uma lista vazia quando não houver pacientes inativos', async () => {
    prisma.patient.findMany.mockResolvedValue([]);

    const result = await service.findInactive();

    expect(result).toEqual([]);

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: {
        isActive: false,
      },
      include: {
        medications: {
          where: {
            isActive: true,
          },
        },
      },
    });
  });

  it('não deve retornar pacientes ativos na busca de inativos', async () => {
    const inactivePatients = [
      {
        id: 2,
        name: 'Maria',
        cpf: '98765432100',
        phone: '83988888888',
        diagnosticHypothesis: null,
        doctorName: null,
        generalNotes: null,
        isActive: false,
        medications: [],
      },
    ];

    prisma.patient.findMany.mockResolvedValue(inactivePatients);

    const result = await service.findInactive();

    expect(result).toHaveLength(1);
    expect(result[0].isActive).toBe(false);
  });
});

describe('activate', () => {
  it('deve reativar um paciente inativo', async () => {
    const inactivePatient = {
      id: 1,
      name: 'João da Silva',
      cpf: '12345678900',
      phone: '83999999999',
      diagnosticHypothesis: null,
      doctorName: null,
      generalNotes: null,
      isActive: false,
      medications: [],
    };

    const activatedPatient = {
      id: 1,
      name: 'João da Silva',
      cpf: '12345678900',
      phone: '83999999999',
      diagnosticHypothesis: null,
      doctorName: null,
      generalNotes: null,
      isActive: true,
      medications: [],
    };

    prisma.patient.findFirst.mockResolvedValue(inactivePatient);
    prisma.patient.update.mockResolvedValue(activatedPatient);

    const result = await service.activate(1);

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: {
        id: 1,
        isActive: false,
      },
    });

    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
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

    expect(result).toEqual(activatedPatient);
  });

  it('deve lançar NotFoundException quando o paciente inativo não existir', async () => {
    prisma.patient.findFirst.mockResolvedValue(null);

    await expect(service.activate(999)).rejects.toThrow(
      new NotFoundException('Paciente inativo não encontrado.'),
    );

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: {
        id: 999,
        isActive: false,
      },
    });

    expect(prisma.patient.update).not.toHaveBeenCalled();
  });

  it('não deve atualizar um paciente que não esteja inativo', async () => {
    prisma.patient.findFirst.mockResolvedValue(null);

    await expect(service.activate(1)).rejects.toThrow(
      NotFoundException,
    );

    expect(prisma.patient.update).not.toHaveBeenCalled();
  });

  it('deve retornar o paciente reativado com seus medicamentos ativos', async () => {
    const inactivePatient = {
      id: 1,
      name: 'João da Silva',
      cpf: '12345678900',
      phone: '83999999999',
      diagnosticHypothesis: null,
      doctorName: null,
      generalNotes: null,
      isActive: false,
      medications: [],
    };

    const activatedPatient = {
      id: 1,
      name: 'João da Silva',
      cpf: '12345678900',
      phone: '83999999999',
      diagnosticHypothesis: null,
      doctorName: null,
      generalNotes: null,
      isActive: true,
      medications: [
        {
          id: 10,
          name: 'Sertralina',
          isActive: true,
        },
      ],
    };

    prisma.patient.findFirst.mockResolvedValue(inactivePatient);
    prisma.patient.update.mockResolvedValue(activatedPatient);

    const result = await service.activate(1);

    expect(result).toEqual(activatedPatient);
    expect(result.isActive).toBe(true);
    expect(result.medications).toHaveLength(1);
    expect(result.medications[0].isActive).toBe(true);
  });
});