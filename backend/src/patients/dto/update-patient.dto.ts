import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { UpdatePatientMedicationDto } from './update-patient-medication.dto';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(11)
  cpf?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsDateString()
  treatmentStartDate?: string;

  @IsOptional()
  @IsString()
  diagnosticHypothesis?: string;

  @IsOptional()
  @IsBoolean()
  hasMedicalFollowUp?: boolean;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePatientMedicationDto)
  medications?: UpdatePatientMedicationDto[];

  @IsOptional()
  @IsString()
  generalNotes?: string;
}