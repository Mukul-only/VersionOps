import { PartialType } from '@nestjs/swagger';
import { CreateEventResultDto } from './create-event-result.dto';

export class UpdateEventResultDto extends PartialType(CreateEventResultDto) {}
