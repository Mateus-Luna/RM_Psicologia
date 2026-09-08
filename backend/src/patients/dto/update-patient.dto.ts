import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CreatePatientDto } from './create-patient.dto';
import { UpdatePatientMedicationDto } from './update-patient-medication.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePatientMedicationDto)
  medications?: UpdatePatientMedicationDto[];
}