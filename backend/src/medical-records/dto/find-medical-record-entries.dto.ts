import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { MedicalRecordEntryType } from '../../../generated/prisma/enums';

export class FindMedicalRecordEntriesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MedicalRecordEntryType)
  type?: MedicalRecordEntryType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}