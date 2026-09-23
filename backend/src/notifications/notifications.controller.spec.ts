import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const notificationsServiceMock = {
    getTodayBirthdays: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(
      NotificationsController,
    );
  });

  describe('getTodayBirthdays', () => {
    it('should return today birthdays', async () => {
      const birthdays = [
        {
          id: 1,
          name: 'João Silva',
          birthDate: new Date('1998-09-23T00:00:00.000Z'),
        },
        {
          id: 2,
          name: 'Maria Souza',
          birthDate: new Date('2001-09-23T00:00:00.000Z'),
        },
      ];

      notificationsServiceMock.getTodayBirthdays.mockResolvedValue(
        birthdays,
      );

      const result = await controller.getTodayBirthdays();

      expect(result).toEqual(birthdays);

      expect(
        notificationsServiceMock.getTodayBirthdays,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when there are no birthdays today', async () => {
      notificationsServiceMock.getTodayBirthdays.mockResolvedValue([]);

      const result = await controller.getTodayBirthdays();

      expect(result).toEqual([]);

      expect(
        notificationsServiceMock.getTodayBirthdays,
      ).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from the notifications service', async () => {
      const error = new Error('Failed to load birthday notifications');

      notificationsServiceMock.getTodayBirthdays.mockRejectedValue(error);

      await expect(
        controller.getTodayBirthdays(),
      ).rejects.toThrow(error);

      expect(
        notificationsServiceMock.getTodayBirthdays,
      ).toHaveBeenCalledTimes(1);
    });
  });
});