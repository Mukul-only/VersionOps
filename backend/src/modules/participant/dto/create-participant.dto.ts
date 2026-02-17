import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';
import { Year } from '@prisma/client';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  name: string;

  @IsEnum(Year)
  year: Year;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Trim()
  hackerearthUser?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Trim()
  phone?: string;

  @IsNotEmpty()
  collegeId: number; // College association
}
