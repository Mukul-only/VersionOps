import { Module } from '@nestjs/common';
import { EventParticipationController } from './event-participation.controller';
import { EventParticipationService } from './event-participation.service';

@Module({
  controllers: [EventParticipationController],
  providers: [EventParticipationService],
  exports: [EventParticipationService],
})
export class EventParticipationModule {}
