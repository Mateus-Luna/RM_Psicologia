import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { RestoreService } from './restore.service';

@Module({
  controllers: [BackupController],
  providers: [BackupService, RestoreService],
})
export class BackupModule {}