import { IsInt, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class BulkCopyParticipantsDto {
  @IsInt()
  fromEventId: number;

  @IsInt()
  toEventId: number;

  // If empty → copy ALL
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  participantIds?: number[];
}
