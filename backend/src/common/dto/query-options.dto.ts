import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '../decorators/trim.decorator';

/**
 * Query options DTO for pagination, search, sorting, and filtering.
 */
export class QueryOptionsDto {
  @ApiPropertyOptional({
    description: 'Number of records to skip (offset for pagination)',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of records to return (limit for pagination)',
    example: 20,
    minimum: 1,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term applied across searchable fields',
    example: 'john doe',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Trim()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field name to sort by',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sorting order (ascending or descending)',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description:
      'JSON string for advanced filtering (e.g., {"status":"ACTIVE"})',
    example: '{"status":"ACTIVE"}',
  })
  @IsOptional()
  @IsString()
  @Type(() => Object)
  filters?: string;

  @ApiPropertyOptional({
    description: 'Whether to include related entities in the response',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRelations?: boolean = false;
}
