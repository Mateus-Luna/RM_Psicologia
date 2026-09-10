import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { MedicalRecordsService } from './medical-records.service';

import { CreateMedicalRecordEntryDto } from './dto/create-medical-record-entry.dto';
import { UpdateMedicalRecordEntryDto } from './dto/update-medical-record-entry.dto';
import { FindMedicalRecordEntriesDto } from './dto/find-medical-record-entries.dto';

@Controller('patients/:patientId/medical-records')
export class MedicalRecordsController {
  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
  ) {}

  @Post()
  create(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() createDto: CreateMedicalRecordEntryDto,
  ) {
    return this.medicalRecordsService.create(patientId, createDto);
  }

  @Get()
  findAll(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() filters: FindMedicalRecordEntriesDto,
  ) {
    return this.medicalRecordsService.findAll(patientId, filters);
  }

  @Get(':id')
  findOne(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.medicalRecordsService.findOne(patientId, id);
  }

  @Patch(':id')
  update(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMedicalRecordEntryDto,
  ) {
    return this.medicalRecordsService.update(
      patientId,
      id,
      updateDto,
    );
  }
}