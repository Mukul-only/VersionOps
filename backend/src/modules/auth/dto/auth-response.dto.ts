import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthResponseDto {
  @ApiProperty({
    example: 'a3f5c9e2-8c1b-4d23-b9aa-9c7f6e3f1111',
    description: 'Unique staff ID (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the staff member',
  })
  name: string;

  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email address of the staff member',
  })
  email: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'Role assigned to the staff member',
  })
  role: UserRole;
}
