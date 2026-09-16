import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  patientId!: number;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;

  @IsOptional()
  @IsString()
  recurrenceId?: string;
}