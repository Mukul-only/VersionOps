import { IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Position } from '@prisma/client';

export class CreateEventResultDto {
  @ApiProperty({
    description: 'ID of the event',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  eventId: number;

  @ApiProperty({
    description: 'ID of the participant',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  participantId: number;

  @ApiProperty({
    description: 'Final position secured in the event',
    enum: Position,
    example: Position.FIRST, // adjust based on your enum values
  })
  @IsEnum(Position)
  position: Position;
}
