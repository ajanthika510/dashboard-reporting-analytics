import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class DashboardTrendsQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO-8601 date string' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO-8601 date string' })
  to?: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'], { message: 'groupBy must be day, week, or month' })
  groupBy?: 'day' | 'week' | 'month' = 'month';

  @IsOptional()
  @IsUUID('4', { message: 'branchId must be a valid UUID' })
  branchId?: string;
}
