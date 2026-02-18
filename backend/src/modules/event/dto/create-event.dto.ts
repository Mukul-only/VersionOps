import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamSize?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  participationPoints?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  firstPrizePoints?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  secondPrizePoints?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  thirdPrizePoints?: number;
}
