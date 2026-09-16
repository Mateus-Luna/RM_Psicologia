import { Test, TestingModule } from '@nestjs/testing';

import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const prismaMock = {
    patient: {
      findUnique: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});