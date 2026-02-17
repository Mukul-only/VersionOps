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
import { Trim } from '../decorators/trim.decorator';

/**
 * Query options DTO for pagination, search, sorting, and filtering.
 */
export class QueryOptionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Trim()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  @Type(() => Object)
  filters?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRelations?: boolean = false;
}
