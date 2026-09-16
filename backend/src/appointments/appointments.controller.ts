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

import { AppointmentsService } from './appointments.service';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  findAll(@Query() dto: FindAppointmentsDto) {
    return this.appointmentsService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, dto);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.confirm(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancel(id);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.complete(id);
  }

  @Patch(':id/no-show')
  markAsNoShow(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.markAsNoShow(id);
  }
}