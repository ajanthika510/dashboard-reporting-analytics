import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('rbac-test')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RbacTestController {
  @Get('admin')
  @Roles('ADMINISTRATOR')
  admin(@Req() request: AuthenticatedRequest) {
    return {
      message: 'Administrator access granted.',
      user: request.user,
    };
  }

  @Get('manager')
  @Roles('MANAGER')
  manager(@Req() request: AuthenticatedRequest) {
    return {
      message: 'Manager access granted.',
      user: request.user,
    };
  }

  @Get('analyst')
  @Roles('ANALYST')
  analyst(@Req() request: AuthenticatedRequest) {
    return {
      message: 'Analyst access granted.',
      user: request.user,
    };
  }

  @Get('viewer')
  @Roles('VIEWER')
  viewer(@Req() request: AuthenticatedRequest) {
    return {
      message: 'Viewer access granted.',
      user: request.user,
    };
  }
}