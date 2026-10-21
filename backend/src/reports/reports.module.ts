import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportingController } from '../reporting/reporting.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController, ReportingController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
