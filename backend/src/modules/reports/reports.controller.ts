import { Controller, Get, UseGuards } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ReportsService } from './reports.service';

import { JwtAuthGuard } from '../auth/gaurds/jwt-auth.gaurd';
import { PermissionsGuard } from '../auth/gaurds/permission.gaurd';
import { Permission } from '../auth/decorators/permission.decorator';
import { PERMISSIONS } from '../auth/rbac/role-permissions.map';

import { CollegeReportResponse } from './types/report.types';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ─────────────────────────────────────────────
  // MY COLLEGE REPORT
  // ─────────────────────────────────────────────

  @Permission(PERMISSIONS.REPORT_VIEW)
  @Get('my-college')
  @ApiOperation({
    summary: 'Get logged in participant college report',
  })
  @ApiResponse({
    status: 200,
    description: 'College report fetched successfully',
  })
  async getMyCollegeReport(
    @CurrentUser('id') id: string,
  ): Promise<CollegeReportResponse> {
    return this.reportsService.getMyCollegeReport(id);
  }
}
