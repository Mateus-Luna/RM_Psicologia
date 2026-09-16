import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { AppointmentStatus } from '../../../generated/prisma/enums';

export class FindAppointmentsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  patientName?: string;
}