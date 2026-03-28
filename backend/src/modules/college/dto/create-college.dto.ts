import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim, ToUpperCase } from 'src/common/decorators';

export class CreateCollegeDto {
  @ApiProperty({
    description: 'Unique short code for the college (stored in uppercase)',
    example: 'NITT',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @ToUpperCase()
  @Trim()
  code: string;

  @ApiProperty({
    description: 'Full name of the college',
    example: 'National Institute of Technology, Trichy',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Trim()
  name: string;
}
