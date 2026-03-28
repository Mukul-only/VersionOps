import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventParticipationDto {
  @ApiProperty({
    description: 'Event ID where participant is being registered',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  eventId: number;

  @ApiProperty({
    description: 'Participant ID being added to the event',
    example: 25,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  participantId: number;

  @ApiPropertyOptional({
    description: 'Optional dummy ID assigned during event',
    example: 'D-101',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dummyId?: string;

  @ApiPropertyOptional({
    description: 'Optional team ID if participant is part of a team',
    example: 'TEAM-A1',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  teamId?: string;
}
