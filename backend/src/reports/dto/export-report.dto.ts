import {
  IsDateString,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ExportReportDto {
  @IsOptional()
  @IsUUID('4', { message: 'reportId must be a valid UUID' })
  reportId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ServiceTicket', 'Transaction', 'tickets', 'transactions'], {
    message: 'dataset must be ServiceTicket or Transaction',
  })
  dataset?: string;

  @IsOptional()
  @IsString()
  dimension?: string;

  @IsOptional()
  @IsString()
  @IsIn(['count', 'sum', 'avg', 'average'])
  metric?: 'count' | 'sum' | 'avg' | 'average';

  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO-8601 date string' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO-8601 date string' })
  to?: string;

  @IsOptional()
  @IsUUID('4', { message: 'branchId must be a valid UUID' })
  branchId?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsIn(['aggregated', 'raw'], { message: 'exportType must be aggregated or raw' })
  exportType?: 'aggregated' | 'raw' = 'aggregated';
}
