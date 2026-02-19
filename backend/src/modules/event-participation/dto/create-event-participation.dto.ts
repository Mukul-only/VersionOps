import { IsInt, IsOptional, IsString } from 'class-validator';

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
}
