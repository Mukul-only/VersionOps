import { IsEnum, IsInt } from 'class-validator';
import { Position } from '@prisma/client';

export class CreateEventResultDto {
  @IsInt()
  eventId: number;

  @IsInt()
  participantId: number;

  @IsEnum(Position)
  position: Position;
}
