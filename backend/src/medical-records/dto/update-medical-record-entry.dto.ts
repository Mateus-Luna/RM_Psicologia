import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { MedicalRecordEntryType } from '../../../generated/prisma/enums';

export class UpdateMedicalRecordEntryDto {
  @IsOptional()
  @IsEnum(MedicalRecordEntryType)
  type?: MedicalRecordEntryType;

  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}