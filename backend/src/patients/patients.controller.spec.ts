import { Test, TestingModule } from '@nestjs/testing';

import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

describe('PatientsController', () => {
  let controller: PatientsController;

  const patientsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
});