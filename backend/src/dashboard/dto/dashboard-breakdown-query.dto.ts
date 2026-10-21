import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class DashboardBreakdownQueryDto {
  @IsNotEmpty({ message: 'dimension is required' })
  @IsString()
  @IsIn(['status', 'category', 'priority', 'branch'], {
    message: 'dimension must be one of: status, category, priority, branch',
  })
  dimension!: 'status' | 'category' | 'priority' | 'branch';

  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO-8601 date string' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO-8601 date string' })
  to?: string;

  @IsOptional()
  @IsUUID('4', { message: 'branchId must be a valid UUID' })
  branchId?: string;
}
