import { PartialType } from '@nestjs/mapped-types';
import { CreateEventParticipationDto } from './create-event-participation.dto';

export class UpdateEventParticipationDto extends PartialType(
  CreateEventParticipationDto,
) {}
