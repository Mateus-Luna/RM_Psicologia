import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { AppointmentsModule } from './appointments/appointments.module';


@Module({
  imports: [PrismaModule, UsersModule, AuthModule, PatientsModule, MedicalRecordsModule, AppointmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
