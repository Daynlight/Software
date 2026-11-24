import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ minLength: 3, maxLength: 100, example: 'Zespół A' })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    minLength: 10,
    maxLength: 2000,
    example: 'Aplikacja do organizacji przebiegu projektu inżynierskiego.',
  })
  @IsString()
  @Length(10, 2000)
  description: string;
}
