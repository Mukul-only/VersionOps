import { PartialType } from '@nestjs/mapped-types';
import { CreateEventResultDto } from './create-event-result.dto';

export class UpdateEventResultDto extends PartialType(CreateEventResultDto) {}
