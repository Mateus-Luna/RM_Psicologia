import { Test, TestingModule } from '@nestjs/testing';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  const appointmentsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
    complete: jest.fn(),
    markAsNoShow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: appointmentsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(
      AppointmentsController,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});