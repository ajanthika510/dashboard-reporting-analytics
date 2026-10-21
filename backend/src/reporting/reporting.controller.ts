import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportsService } from '../reports/reports.service';

@Controller('reporting')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST', 'VIEWER')
export class ReportingController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('datasets')
  getDatasets() {
    return this.reportsService.getDatasetsMetadata();
  }
}
