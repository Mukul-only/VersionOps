import { PartialType } from '@nestjs/swagger';
import { CreateEventParticipationDto } from './create-event-participation.dto';

export class UpdateEventParticipationDto extends PartialType(
  CreateEventParticipationDto,
) {}
