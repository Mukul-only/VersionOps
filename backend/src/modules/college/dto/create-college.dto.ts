import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim, ToUpperCase } from 'src/common/decorators';

export class CreateCollegeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @ToUpperCase()
  @Trim()
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  name: string;
}
