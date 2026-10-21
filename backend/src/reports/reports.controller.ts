import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ReportsService } from './reports.service';
import { ReportPreviewDto } from './dto/report-preview.dto';
import { CreateSavedReportDto } from './dto/create-saved-report.dto';
import { UpdateSavedReportDto } from './dto/update-saved-report.dto';
import { ExportReportDto } from './dto/export-report.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('preview')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST', 'VIEWER')
  preview(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ReportPreviewDto,
  ) {
    return this.reportsService.preview(request.user, dto);
  }

  @Get('saved')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST', 'VIEWER')
  findAllSaved(@Req() request: AuthenticatedRequest) {
    return this.reportsService.findAllSaved(request.user);
  }

  @Post('saved')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST')
  createSaved(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateSavedReportDto,
  ) {
    return this.reportsService.createSaved(request.user, dto);
  }

  @Get('saved/:id')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST', 'VIEWER')
  findOneSaved(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reportsService.findOneSaved(id, request.user);
  }

  @Patch('saved/:id')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST')
  updateSaved(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateSavedReportDto,
  ) {
    return this.reportsService.updateSaved(id, request.user, dto);
  }

  @Delete('saved/:id')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST')
  removeSaved(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reportsService.removeSaved(id, request.user);
  }

  @Post('export')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST')
  async exportCsv(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ExportReportDto,
    @Res() response: Response,
  ) {
    const result = await this.reportsService.exportCsv(request.user, dto);

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Export-Row-Count', String(result.rowCount));
    response.send('\uFEFF' + result.csv);
  }

  @Get('export-history')
  @Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST')
  getExportHistory(@Req() request: AuthenticatedRequest) {
    return this.reportsService.getExportHistory(request.user);
  }
}
