import {
  IsInt,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkCopyParticipantsDto {
  @ApiProperty({
    description: 'Source event ID from which participants will be copied',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  fromEventId: number;

  @ApiProperty({
    description: 'Target event ID to which participants will be copied',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  toEventId: number;

  @ApiPropertyOptional({
    description:
      'List of participant IDs to copy. If not provided, all participants from the source event will be copied.',
    example: [10, 11, 12],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  participantIds?: number[];
}
