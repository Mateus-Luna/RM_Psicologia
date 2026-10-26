import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { MedicalRecordEntryType } from '../../../generated/prisma/enums';

export class CreateMedicalRecordEntryDto {
  @IsEnum(MedicalRecordEntryType)
  type!: MedicalRecordEntryType;

  @IsDateString()
  entryDate!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];
}