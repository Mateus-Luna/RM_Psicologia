import { IsBooleanString, IsOptional, IsString } from 'class-validator';

export class FindPatientsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  hasMedicalFollowUp?: string;

  @IsOptional()
  @IsBooleanString()
  usesMedication?: string;

  @IsOptional()
  @IsString()
  medication?: string;
}