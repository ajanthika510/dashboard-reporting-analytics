
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ReportSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
