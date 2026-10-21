import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSavedReportDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject({ message: 'configJson must be an object' })
  configJson?: Record<string, any>;

  @IsOptional()
  @IsIn(['PRIVATE', 'SHARED'], { message: 'visibility must be PRIVATE or SHARED' })
  visibility?: 'PRIVATE' | 'SHARED';
}
