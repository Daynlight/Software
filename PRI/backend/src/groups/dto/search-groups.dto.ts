import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_MEMBERS } from '../groups.constants';

const toBoolean = (value: unknown): unknown => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
};

export class SearchGroupsQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  leader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  hasFreeSlots?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_MEMBERS - 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MEMBERS - 1)
  minFreeSlots?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'name', 'memberCount', 'freeSlots'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'name', 'memberCount', 'freeSlots'])
  sort: 'createdAt' | 'name' | 'memberCount' | 'freeSlots' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
