import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardTrendsQueryDto } from './dto/dashboard-trends-query.dto';
import { DashboardBreakdownQueryDto } from './dto/dashboard-breakdown-query.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMINISTRATOR', 'MANAGER', 'ANALYST', 'VIEWER')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.dashboardService.getSummary(request.user, query);
  }

  @Get('trends')
  getTrends(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardTrendsQueryDto,
  ) {
    return this.dashboardService.getTrends(request.user, query);
  }

  @Get('breakdown')
  getBreakdown(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardBreakdownQueryDto,
  ) {
    return this.dashboardService.getBreakdown(request.user, query);
  }

  @Get('preferences')
  getPreferences(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getPreferences(request.user);
  }

  @Put('preferences')
  updatePreferences(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.dashboardService.updatePreferences(request.user, dto.widgetsJson);
  }
}
