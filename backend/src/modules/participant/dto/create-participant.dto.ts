import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsEmail,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from 'src/common/decorators/trim.decorator';
import { Year } from '@prisma/client';

export class CreateParticipantDto {
  @ApiProperty({
    description: 'Full name of the participant',
    example: 'Arun Kumar',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  name: string;

  @ApiProperty({
    description: 'Academic year of the participant',
    enum: Year,
    example: Year.ONE,
  })
  @IsEnum(Year)
  year: Year;

  @ApiProperty({
    description: 'Email address of the participant',
    example: 'arun.kumar@example.com',
    maxLength: 255,
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'HackerEarth username (if applicable)',
    example: 'arun_dev',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Trim()
  hackerearthUser?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '9876543210',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Trim()
  phone?: string;

  @ApiProperty({
    description: 'ID of the associated college',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  collegeId: number;
}
