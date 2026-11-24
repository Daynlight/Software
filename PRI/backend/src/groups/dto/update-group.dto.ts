import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateGroupDto {
  @ApiPropertyOptional({ minLength: 3, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @ApiPropertyOptional({ minLength: 10, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  description?: string;
}
