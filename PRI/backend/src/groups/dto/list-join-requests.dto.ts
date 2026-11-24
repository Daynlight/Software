import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { JoinRequestStatus } from '../../database/join_requests/join-requests.entity';

export class ListJoinRequestsQueryDto {
  @ApiPropertyOptional({
    enum: [
      JoinRequestStatus.PENDING,
      JoinRequestStatus.ACCEPTED,
      JoinRequestStatus.REJECTED,
      JoinRequestStatus.CANCELLED,
      'ALL',
    ],
    default: JoinRequestStatus.PENDING,
  })
  @IsOptional()
  @IsIn([
    JoinRequestStatus.PENDING,
    JoinRequestStatus.ACCEPTED,
    JoinRequestStatus.REJECTED,
    JoinRequestStatus.CANCELLED,
    'ALL',
  ])
  status: JoinRequestStatus | 'ALL' = JoinRequestStatus.PENDING;

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
}
