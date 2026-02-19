import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { BulkImportService } from './bulk-import.service';
@Module({
  controllers: [ParticipantController],
  providers: [ParticipantService, BulkImportService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
