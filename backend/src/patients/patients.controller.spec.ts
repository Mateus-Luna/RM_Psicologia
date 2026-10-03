import { Test, TestingModule } from '@nestjs/testing';

import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

describe('PatientsController', () => {
  let controller: PatientsController;

  const patientsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findInactive: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    activate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        {
          provide: PatientsService,
          useValue: patientsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findInactive', () => {
    it('deve chamar o service para buscar pacientes inativos', async () => {
      const patients = [
        {
          id: 1,
          name: 'João da Silva',
          isActive: false,
        },
        {
          id: 2,
          name: 'Maria da Silva',
          isActive: false,
        },
      ];

      patientsServiceMock.findInactive.mockResolvedValue(patients);

      const result = await controller.findInactive();

      expect(patientsServiceMock.findInactive).toHaveBeenCalledTimes(1);
      expect(patientsServiceMock.findInactive).toHaveBeenCalledWith();
      expect(result).toEqual(patients);
    });

    it('deve retornar uma lista vazia quando não houver pacientes inativos', async () => {
      patientsServiceMock.findInactive.mockResolvedValue([]);

      const result = await controller.findInactive();

      expect(patientsServiceMock.findInactive).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('activate', () => {
    it('deve chamar o service para reativar o paciente', async () => {
      const patient = {
        id: 1,
        name: 'João da Silva',
        isActive: true,
      };

      patientsServiceMock.activate.mockResolvedValue(patient);

      const result = await controller.activate(1);

      expect(patientsServiceMock.activate).toHaveBeenCalledTimes(1);
      expect(patientsServiceMock.activate).toHaveBeenCalledWith(1);
      expect(result).toEqual(patient);
    });

    it('deve encaminhar o id recebido pelo controller para o service', async () => {
      const patient = {
        id: 1,
        name: 'João da Silva',
        isActive: true,
      };

      patientsServiceMock.activate.mockResolvedValue(patient);

      const result = await controller.activate('1');

      expect(patientsServiceMock.activate).toHaveBeenCalledTimes(1);
      expect(patientsServiceMock.activate).toHaveBeenCalledWith('1');
      expect(result).toEqual(patient);
    });
  });
});