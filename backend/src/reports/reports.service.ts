import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ReportPreviewDto } from './dto/report-preview.dto';
import { CreateSavedReportDto } from './dto/create-saved-report.dto';
import { UpdateSavedReportDto } from './dto/update-saved-report.dto';
import { ExportReportDto } from './dto/export-report.dto';

interface DateFilter {
  gte?: Date;
  lte?: Date;
}

export interface ReportRow {
  groupKey: string;
  label: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  metricValue: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  getDatasetsMetadata() {
    return {
      datasets: [
        {
          key: 'ServiceTicket',
          label: 'Service Tickets',
          description: 'Customer service tickets, incidents, and resolutions across branches',
          dateField: 'openedAt',
          dimensions: [
            { key: 'branch', label: 'Branch', type: 'relation' },
            { key: 'category', label: 'Category', type: 'string' },
            {
              key: 'status',
              label: 'Status',
              type: 'enum',
              options: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'],
            },
            {
              key: 'priority',
              label: 'Priority',
              type: 'enum',
              options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
            },
            { key: 'assignedStaff', label: 'Assigned Staff', type: 'relation' },
          ],
          metrics: [
            { key: 'count', label: 'Count of Tickets', field: '*' },
            { key: 'sum', label: 'Total Value (Amount)', field: 'amount' },
            { key: 'avg', label: 'Average Value (Amount)', field: 'amount' },
          ],
          filterableFields: ['branch', 'status', 'category', 'priority'],
        },
        {
          key: 'Transaction',
          label: 'Transactions',
          description: 'Operational sales, retainers, contracts, and payment transactions',
          dateField: 'transactionDate',
          dimensions: [
            { key: 'branch', label: 'Branch', type: 'relation' },
            { key: 'category', label: 'Category', type: 'string' },
            {
              key: 'status',
              label: 'Status',
              type: 'enum',
              options: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
            },
            { key: 'staff', label: 'Staff Member', type: 'relation' },
          ],
          metrics: [
            { key: 'count', label: 'Transaction Count', field: '*' },
            { key: 'sum', label: 'Total Value (Amount)', field: 'amount' },
            { key: 'avg', label: 'Average Value (Amount)', field: 'amount' },
          ],
          filterableFields: ['branch', 'status', 'category'],
        },
      ],
    };
  }

  private validateDateRange(from?: string, to?: string): { startDate?: Date; endDate?: Date } {
    if (from && to && from.slice(0, 10) > to.slice(0, 10)) {
      throw new BadRequestException('from date must be on or before to date.');
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (from) {
      const parsedFrom = new Date(from);
      if (isNaN(parsedFrom.getTime())) {
        throw new BadRequestException('Invalid from date format.');
      }
      startDate = new Date(`${from.slice(0, 10)}T00:00:00.000Z`);
    }

    if (to) {
      const parsedTo = new Date(to);
      if (isNaN(parsedTo.getTime())) {
        throw new BadRequestException('Invalid to date format.');
      }
      endDate = new Date(`${to.slice(0, 10)}T23:59:59.999Z`);
    }

    return { startDate, endDate };
  }

  async resolveBranchIds(user: AuthenticatedUser, requestedBranchId?: string): Promise<string[]> {
    if (user.role === 'ADMINISTRATOR') {
      if (requestedBranchId) {
        const branch = await this.prisma.branch.findUnique({
          where: { id: requestedBranchId },
          select: { id: true, isActive: true },
        });
        if (!branch) {
          throw new NotFoundException('Branch not found.');
        }
        return [branch.id];
      }

      const activeBranches = await this.prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      return activeBranches.map((b) => b.id);
    }

    if (user.branchId) {
      if (requestedBranchId && requestedBranchId !== user.branchId) {
        throw new ForbiddenException('You do not have access to the requested branch.');
      }
      return [user.branchId];
    }

    if (requestedBranchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: requestedBranchId, isActive: true },
        select: { id: true },
      });
      if (!branch) {
        throw new NotFoundException('Branch not found or inactive.');
      }
      return [branch.id];
    }

    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }

  private normalizeDataset(dataset: string): 'ServiceTicket' | 'Transaction' {
    const lower = dataset.toLowerCase();
    if (lower === 'serviceticket' || lower === 'tickets' || lower === 'ticket') {
      return 'ServiceTicket';
    }
    if (lower === 'transaction' || lower === 'transactions') {
      return 'Transaction';
    }
    throw new BadRequestException(`Unknown dataset "${dataset}". Supported: ServiceTicket, Transaction`);
  }

  async preview(user: AuthenticatedUser, dto: ReportPreviewDto) {
    const dataset = this.normalizeDataset(dto.dataset);
    const { startDate, endDate } = this.validateDateRange(dto.from, dto.to);
    const branchIds = await this.resolveBranchIds(user, dto.branchId || dto.filters?.['branchId']);

    // Validate metric & dimension compatibility
    const allowedDimensionsTicket = ['branch', 'category', 'status', 'priority', 'assignedStaff'];
    const allowedDimensionsTx = ['branch', 'category', 'status', 'staff'];

    if (dataset === 'ServiceTicket' && !allowedDimensionsTicket.includes(dto.dimension)) {
      throw new BadRequestException(
        `Dimension "${dto.dimension}" is invalid for ServiceTicket. Allowed: ${allowedDimensionsTicket.join(', ')}`,
      );
    }
    if (dataset === 'Transaction' && !allowedDimensionsTx.includes(dto.dimension)) {
      throw new BadRequestException(
        `Dimension "${dto.dimension}" is invalid for Transaction. Allowed: ${allowedDimensionsTx.join(', ')}`,
      );
    }

    const metric = dto.metric === 'average' ? 'avg' : dto.metric;

    const dateFilter: DateFilter = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    let rows: ReportRow[] = [];

    if (dataset === 'ServiceTicket') {
      const where: any = {
        branchId: { in: branchIds },
        ...(Object.keys(dateFilter).length ? { openedAt: dateFilter } : {}),
      };

      if (dto.filters?.status) where.status = dto.filters.status;
      if (dto.filters?.priority) where.priority = dto.filters.priority;
      if (dto.filters?.category) where.category = dto.filters.category;

      const tickets = await this.prisma.serviceTicket.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          assignedStaff: { select: { id: true, name: true } },
        },
      });

      const groupMap = new Map<string, { label: string; count: number; sum: number }>();

      for (const t of tickets) {
        let key = 'Unassigned';
        let label = 'Unassigned';

        if (dto.dimension === 'branch') {
          key = t.branchId;
          label = t.branch.name;
        } else if (dto.dimension === 'category') {
          key = t.category || 'General';
          label = key;
        } else if (dto.dimension === 'status') {
          key = t.status;
          label = t.status;
        } else if (dto.dimension === 'priority') {
          key = t.priority;
          label = t.priority;
        } else if (dto.dimension === 'assignedStaff') {
          key = t.assignedStaffId || 'Unassigned';
          label = t.assignedStaff?.name || 'Unassigned';
        }

        const existing = groupMap.get(key) || { label, count: 0, sum: 0 };
        existing.count += 1;
        existing.sum += Number(t.amount);
        groupMap.set(key, existing);
      }

      rows = Array.from(groupMap.entries()).map(([groupKey, data]) => {
        const avg = data.count > 0 ? Number((data.sum / data.count).toFixed(2)) : 0;
        let metricVal = data.count;
        if (metric === 'sum') metricVal = Number(data.sum.toFixed(2));
        else if (metric === 'avg') metricVal = avg;

        return {
          groupKey,
          label: data.label,
          count: data.count,
          totalAmount: Number(data.sum.toFixed(2)),
          avgAmount: avg,
          metricValue: metricVal,
        };
      });
    } else {
      // Transaction dataset
      const where: any = {
        branchId: { in: branchIds },
        ...(Object.keys(dateFilter).length ? { transactionDate: dateFilter } : {}),
      };

      if (dto.filters?.status) where.status = dto.filters.status;
      if (dto.filters?.category) where.category = dto.filters.category;

      const transactions = await this.prisma.transaction.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          staff: { select: { id: true, name: true } },
        },
      });

      const groupMap = new Map<string, { label: string; count: number; sum: number }>();

      for (const tx of transactions) {
        let key = 'Unassigned';
        let label = 'Unassigned';

        if (dto.dimension === 'branch') {
          key = tx.branchId;
          label = tx.branch.name;
        } else if (dto.dimension === 'category') {
          key = tx.category || 'General';
          label = key;
        } else if (dto.dimension === 'status') {
          key = tx.status;
          label = tx.status;
        } else if (dto.dimension === 'staff') {
          key = tx.staffId || 'Unassigned';
          label = tx.staff?.name || 'Unassigned';
        }

        const existing = groupMap.get(key) || { label, count: 0, sum: 0 };
        existing.count += 1;
        existing.sum += Number(tx.amount);
        groupMap.set(key, existing);
      }

      rows = Array.from(groupMap.entries()).map(([groupKey, data]) => {
        const avg = data.count > 0 ? Number((data.sum / data.count).toFixed(2)) : 0;
        let metricVal = data.count;
        if (metric === 'sum') metricVal = Number(data.sum.toFixed(2));
        else if (metric === 'avg') metricVal = avg;

        return {
          groupKey,
          label: data.label,
          count: data.count,
          totalAmount: Number(data.sum.toFixed(2)),
          avgAmount: avg,
          metricValue: metricVal,
        };
      });
    }

    // Sort
    const sortOrder = dto.sortOrder === 'asc' ? 1 : -1;
    if (dto.sortBy === 'label') {
      rows.sort((a, b) => a.label.localeCompare(b.label) * sortOrder);
    } else {
      rows.sort((a, b) => (a.metricValue - b.metricValue) * sortOrder);
    }

    const totalRows = rows.length;
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 10;
    const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize);

    const totalCount = rows.reduce((acc, r) => acc + r.count, 0);
    const totalSum = Number(rows.reduce((acc, r) => acc + r.totalAmount, 0).toFixed(2));
    const avgValue = totalCount > 0 ? Number((totalSum / totalCount).toFixed(2)) : 0;

    return {
      dataset,
      dimension: dto.dimension,
      metric,
      columns: [
        { key: 'label', label: dto.dimension.charAt(0).toUpperCase() + dto.dimension.slice(1) },
        { key: 'count', label: 'Count' },
        { key: 'totalAmount', label: 'Total Amount (LKR)' },
        { key: 'avgAmount', label: 'Average Amount (LKR)' },
      ],
      rows: paginatedRows,
      totalRows,
      page,
      pageSize,
      summary: {
        totalGroups: totalRows,
        totalCount,
        totalSum,
        avgValue,
      },
      chartData: rows.slice(0, 15).map((r) => ({
        name: r.label,
        value: r.metricValue,
      })),
    };
  }

  async findAllSaved(user: AuthenticatedUser) {
    if (user.role === 'ADMINISTRATOR') {
      return this.prisma.savedReport.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return this.prisma.savedReport.findMany({
      where: {
        OR: [{ ownerId: user.userId }, { visibility: 'SHARED' }],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createSaved(user: AuthenticatedUser, dto: CreateSavedReportDto) {
    if (user.role === 'VIEWER') {
      throw new ForbiddenException('Viewers do not have permission to create saved reports.');
    }

    const dataset = this.normalizeDataset(dto.dataset);

    const structuredConfig = {
      version: 1,
      dataset,
      ...dto.configJson,
    };

    return this.prisma.savedReport.create({
      data: {
        ownerId: user.userId,
        title: dto.title.trim(),
        dataset,
        configJson: structuredConfig,
        visibility: dto.visibility || 'PRIVATE',
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOneSaved(id: string, user: AuthenticatedUser) {
    const report = await this.prisma.savedReport.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Saved report not found.');
    }

    if (
      report.visibility === 'PRIVATE' &&
      report.ownerId !== user.userId &&
      user.role !== 'ADMINISTRATOR'
    ) {
      throw new ForbiddenException('You do not have access to this private report.');
    }

    return report;
  }

  async updateSaved(id: string, user: AuthenticatedUser, dto: UpdateSavedReportDto) {
    const report = await this.prisma.savedReport.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!report) {
      throw new NotFoundException('Saved report not found.');
    }

    if (report.ownerId !== user.userId && user.role !== 'ADMINISTRATOR') {
      throw new ForbiddenException('You cannot modify another user\'s private saved report.');
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title.trim();
    if (dto.visibility) updateData.visibility = dto.visibility;
    if (dto.configJson) {
      updateData.configJson = {
        version: 1,
        ...dto.configJson,
      };
    }

    return this.prisma.savedReport.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeSaved(id: string, user: AuthenticatedUser) {
    const report = await this.prisma.savedReport.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!report) {
      throw new NotFoundException('Saved report not found.');
    }

    if (report.ownerId !== user.userId && user.role !== 'ADMINISTRATOR') {
      throw new ForbiddenException('You cannot delete another user\'s private saved report.');
    }

    await this.prisma.savedReport.delete({ where: { id } });
    return { success: true, message: 'Saved report deleted successfully.' };
  }

  private escapeCsvCell(cell: any): string {
    if (cell === null || cell === undefined) return '';
    let str = String(cell);

    // Prevent CSV formula injection by prepending ' if begins with =, +, -, or @
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }

    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async exportCsv(user: AuthenticatedUser, dto: ExportReportDto) {
    if (user.role === 'VIEWER') {
      throw new ForbiddenException('Viewers do not have permission to export reports.');
    }

    let dataset = 'Transaction';
    let dimension = 'branch';
    let metric: 'count' | 'sum' | 'avg' = 'count';
    let from = dto.from;
    let to = dto.to;
    let branchId = dto.branchId;
    let filters = dto.filters || {};
    let savedReportId: string | null = null;

    if (dto.reportId) {
      const saved = await this.findOneSaved(dto.reportId, user);
      savedReportId = saved.id;
      dataset = saved.dataset;
      const config = saved.configJson as any;
      dimension = config.dimension || 'branch';
      metric = config.metric || 'count';
      if (!from && config.from) from = config.from;
      if (!to && config.to) to = config.to;
      if (!branchId && config.branchId) branchId = config.branchId;
      if (config.filters) filters = { ...config.filters, ...filters };
    } else if (dto.dataset) {
      dataset = dto.dataset;
      dimension = dto.dimension || 'branch';
      metric = (dto.metric === 'average' ? 'avg' : dto.metric) || 'count';
    }

    const previewResult = await this.preview(user, {
      dataset,
      dimension,
      metric,
      from,
      to,
      branchId,
      filters,
      page: 1,
      pageSize: 10000,
    });

    const headers = previewResult.columns.map((c) => this.escapeCsvCell(c.label));
    const csvLines = [headers.join(',')];

    for (const r of previewResult.rows) {
      const line = [
        this.escapeCsvCell(r.label),
        this.escapeCsvCell(r.count),
        this.escapeCsvCell(r.totalAmount.toFixed(2)),
        this.escapeCsvCell(r.avgAmount.toFixed(2)),
      ];
      csvLines.push(line.join(','));
    }

    // Append summary footer
    csvLines.push('');
    csvLines.push(
      [
        this.escapeCsvCell('TOTAL / SUMMARY'),
        this.escapeCsvCell(previewResult.summary.totalCount),
        this.escapeCsvCell(previewResult.summary.totalSum.toFixed(2)),
        this.escapeCsvCell(previewResult.summary.avgValue.toFixed(2)),
      ].join(','),
    );

    const csvContent = csvLines.join('\r\n');
    const rowCount = previewResult.rows.length;

    // Log export audit trail
    await this.prisma.reportExportLog.create({
      data: {
        actorId: user.userId,
        reportId: savedReportId,
        dataset,
        filtersJson: {
          dimension,
          metric,
          from,
          to,
          branchId,
          ...filters,
        },
        rowCount,
      },
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${dataset.toLowerCase()}-${dimension}-${timestamp}.csv`;

    return {
      filename,
      csv: csvContent,
      rowCount,
    };
  }

  async getExportHistory(user: AuthenticatedUser) {
    const where: any = {};
    if (user.role !== 'ADMINISTRATOR') {
      where.actorId = user.userId;
    }

    const logs = await this.prisma.reportExportLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        report: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs;
  }
}
