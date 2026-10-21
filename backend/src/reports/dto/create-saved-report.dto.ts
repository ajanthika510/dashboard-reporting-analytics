import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSavedReportDto {
  @IsNotEmpty({ message: 'title is required' })
  @IsString()
  title!: string;

  @IsNotEmpty({ message: 'dataset is required' })
  @IsString()
  @IsIn(['ServiceTicket', 'Transaction', 'tickets', 'transactions'], {
    message: 'dataset must be ServiceTicket or Transaction',
  })
  dataset!: string;

  @IsNotEmpty({ message: 'configJson is required' })
  @IsObject({ message: 'configJson must be an object' })
  configJson!: Record<string, any>;

  @IsOptional()
  @IsIn(['PRIVATE', 'SHARED'], { message: 'visibility must be PRIVATE or SHARED' })
  visibility?: 'PRIVATE' | 'SHARED' = 'PRIVATE';
}
