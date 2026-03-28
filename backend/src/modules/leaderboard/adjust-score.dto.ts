import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustScoreDto {
  @ApiProperty({
    description: 'collegeId',
    example: '1',
  })
  @IsInt()
  collegeId: number;

  @ApiProperty({
    description: 'Points to adjust',
    example: '50, -30',
  })
  @IsNumber()
  points: number; // can be negative

  @ApiPropertyOptional({
    description: 'Reason',
    example: 'Violation',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
