import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdatePreferencesDto {
  @IsNotEmpty({ message: 'widgetsJson is required' })
  @IsObject({ message: 'widgetsJson must be an object' })
  widgetsJson!: Record<string, any>;
}
