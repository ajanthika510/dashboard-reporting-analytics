import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class DashboardSummaryQueryDto {
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
