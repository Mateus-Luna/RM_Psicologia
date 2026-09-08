import {
  Type,
} from 'class-transformer';

import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreatePatientMedicationDto } from './create-patient-medication.dto';

export class CreatePatientDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(11)
  cpf!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsDateString()
  birthDate!: string;

  @IsDateString()
  treatmentStartDate!: string;

  @IsOptional()
  @IsString()
  diagnosticHypothesis?: string;

  @IsBoolean()
  hasMedicalFollowUp!: boolean;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePatientMedicationDto)
  medications?: CreatePatientMedicationDto[];

  @IsOptional()
  @IsString()
  generalNotes?: string;
}