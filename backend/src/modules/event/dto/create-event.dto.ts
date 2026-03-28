import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    description: 'Name of the event',
    example: 'Hackathon 2026',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Maximum number of members allowed per team',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  teamSize?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for participation',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  participationPoints?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for first prize',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  firstPrizePoints?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for second prize',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  secondPrizePoints?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for third prize',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  thirdPrizePoints?: number;
}
