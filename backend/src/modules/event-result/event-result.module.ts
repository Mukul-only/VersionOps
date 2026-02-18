import { Module } from '@nestjs/common';
import { EventResultController } from './event-result.controller';
import { EventResultService } from './event-result.service';

@Module({
  controllers: [EventResultController],
  providers: [EventResultService],
  exports: [EventResultService],
})
export class EventResultModule {}
