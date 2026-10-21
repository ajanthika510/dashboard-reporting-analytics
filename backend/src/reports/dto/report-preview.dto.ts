import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReportPreviewDto {
  @IsNotEmpty({ message: 'dataset is required' })
  @IsString()
  @IsIn(['ServiceTicket', 'Transaction', 'tickets', 'transactions'], {
    message: 'dataset must be ServiceTicket or Transaction',
  })
  dataset!: string;

  @IsNotEmpty({ message: 'dimension is required' })
  @IsString()
  @IsIn(
    [
      'branch',
      'category',
      'status',
      'priority',
      'assignedStaff',
      'staff',
    ],
    { message: 'Invalid dimension for dataset' },
  )
  dimension!: string;

  @IsNotEmpty({ message: 'metric is required' })
  @IsString()
  @IsIn(['count', 'sum', 'avg', 'average'], {
    message: 'metric must be count, sum, or avg',
  })
  metric!: 'count' | 'sum' | 'avg' | 'average';

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
  @IsObject({ message: 'filters must be an object' })
  filters?: Record<string, any>;

  @IsOptional()
  @IsIn(['label', 'value'], { message: 'sortBy must be label or value' })
  sortBy?: 'label' | 'value' = 'value';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}
