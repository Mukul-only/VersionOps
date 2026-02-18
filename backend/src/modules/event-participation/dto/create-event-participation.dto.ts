import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { ParticipationStatus } from '@prisma/client';

export class CreateEventParticipationDto {
  @IsInt()
  eventId: number;

  @IsInt()
  participantId: number;

  @IsOptional()
  @IsString()
  dummyId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsEnum(ParticipationStatus)
  status?: ParticipationStatus;
}
