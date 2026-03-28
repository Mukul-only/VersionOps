import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCollegeDto } from './create-college.dto';

export class UpdateCollegeDto extends PartialType(
  OmitType(CreateCollegeDto, ['code'] as const),
) {}
