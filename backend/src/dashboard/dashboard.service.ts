import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardTrendsQueryDto } from './dto/dashboard-trends-query.dto';
import { DashboardBreakdownQueryDto } from './dto/dashboard-breakdown-query.dto';

interface DateFilter {
  gte?: Date;
  lte?: Date;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Role without specific branchId (e.g. global Manager or Analyst/Viewer)
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

  async getSummary(user: AuthenticatedUser, query: DashboardSummaryQueryDto) {
    const { startDate, endDate } = this.validateDateRange(query.from, query.to);
    const branchIds = await this.resolveBranchIds(user, query.branchId);

    const ticketDateFilter: DateFilter = {};
    if (startDate) ticketDateFilter.gte = startDate;
    if (endDate) ticketDateFilter.lte = endDate;

    const txDateFilter: DateFilter = {};
    if (startDate) txDateFilter.gte = startDate;
    if (endDate) txDateFilter.lte = endDate;

    const ticketWhere = {
      branchId: { in: branchIds },
      ...(Object.keys(ticketDateFilter).length ? { openedAt: ticketDateFilter } : {}),
    };

    const txWhere = {
      branchId: { in: branchIds },
      ...(Object.keys(txDateFilter).length ? { transactionDate: txDateFilter } : {}),
    };

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      resolvedTicketsWithTimes,
      completedTransactions,
      completedTxSum,
    ] = await Promise.all([
      this.prisma.serviceTicket.count({ where: ticketWhere }),
      this.prisma.serviceTicket.count({
        where: {
          ...ticketWhere,
          status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.serviceTicket.count({
        where: {
          ...ticketWhere,
          status: { in: ['RESOLVED', 'CLOSED'] },
        },
      }),
      this.prisma.serviceTicket.findMany({
        where: {
          ...ticketWhere,
          status: { in: ['RESOLVED', 'CLOSED'] },
          closedAt: { not: null },
        },
        select: { openedAt: true, closedAt: true },
      }),
      this.prisma.transaction.count({
        where: {
          ...txWhere,
          status: 'COMPLETED',
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          ...txWhere,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
    ]);

    let avgResolutionTimeHours = 0;
    if (resolvedTicketsWithTimes.length > 0) {
      const totalDurationMs = resolvedTicketsWithTimes.reduce((acc, t) => {
        if (!t.closedAt) return acc;
        return acc + Math.max(0, t.closedAt.getTime() - t.openedAt.getTime());
      }, 0);
      avgResolutionTimeHours = Number(
        (totalDurationMs / resolvedTicketsWithTimes.length / (1000 * 60 * 60)).toFixed(2),
      );
    }

    const transactionTotal = Number(completedTxSum._sum.amount?.toFixed(2) ?? 0);

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTimeHours,
      transactionTotal,
      transactionCount: completedTransactions,
      branchCount: branchIds.length,
      generatedAt: new Date().toISOString(),
    };
  }

  async getTrends(user: AuthenticatedUser, query: DashboardTrendsQueryDto) {
    const { startDate, endDate } = this.validateDateRange(query.from, query.to);
    const branchIds = await this.resolveBranchIds(user, query.branchId);

    const ticketDateFilter: DateFilter = {};
    if (startDate) ticketDateFilter.gte = startDate;
    if (endDate) ticketDateFilter.lte = endDate;

    const txDateFilter: DateFilter = {};
    if (startDate) txDateFilter.gte = startDate;
    if (endDate) txDateFilter.lte = endDate;

    const [tickets, transactions] = await Promise.all([
      this.prisma.serviceTicket.findMany({
        where: {
          branchId: { in: branchIds },
          ...(Object.keys(ticketDateFilter).length ? { openedAt: ticketDateFilter } : {}),
        },
        select: { openedAt: true },
        orderBy: { openedAt: 'asc' },
      }),
      this.prisma.transaction.findMany({
        where: {
          branchId: { in: branchIds },
          status: 'COMPLETED',
          ...(Object.keys(txDateFilter).length ? { transactionDate: txDateFilter } : {}),
        },
        select: { transactionDate: true, amount: true },
        orderBy: { transactionDate: 'asc' },
      }),
    ]);

    const formatBucketKey = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      if (query.groupBy === 'day') {
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return `${year}-${month}`;
    };

    const trendMap = new Map<
      string,
      { period: string; ticketCount: number; transactionCount: number; transactionTotal: number }
    >();

    for (const t of tickets) {
      const key = formatBucketKey(t.openedAt);
      const existing = trendMap.get(key) || {
        period: key,
        ticketCount: 0,
        transactionCount: 0,
        transactionTotal: 0,
      };
      existing.ticketCount += 1;
      trendMap.set(key, existing);
    }

    for (const tx of transactions) {
      const key = formatBucketKey(tx.transactionDate);
      const existing = trendMap.get(key) || {
        period: key,
        ticketCount: 0,
        transactionCount: 0,
        transactionTotal: 0,
      };
      existing.transactionCount += 1;
      existing.transactionTotal += Number(tx.amount);
      trendMap.set(key, existing);
    }

    const trends = Array.from(trendMap.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((item) => ({
        ...item,
        transactionTotal: Number(item.transactionTotal.toFixed(2)),
      }));

    return trends;
  }

  async getBreakdown(user: AuthenticatedUser, query: DashboardBreakdownQueryDto) {
    const { startDate, endDate } = this.validateDateRange(query.from, query.to);
    const branchIds = await this.resolveBranchIds(user, query.branchId);

    const ticketDateFilter: DateFilter = {};
    if (startDate) ticketDateFilter.gte = startDate;
    if (endDate) ticketDateFilter.lte = endDate;

    const txDateFilter: DateFilter = {};
    if (startDate) txDateFilter.gte = startDate;
    if (endDate) txDateFilter.lte = endDate;

    if (query.dimension === 'status') {
      const groups = await this.prisma.serviceTicket.groupBy({
        by: ['status'],
        where: {
          branchId: { in: branchIds },
          ...(Object.keys(ticketDateFilter).length ? { openedAt: ticketDateFilter } : {}),
        },
        _count: { _all: true },
      });

      const total = groups.reduce((acc, g) => acc + g._count._all, 0);

      return groups.map((g) => ({
        name: g.status,
        count: g._count._all,
        percentage: total > 0 ? Number(((g._count._all / total) * 100).toFixed(1)) : 0,
      }));
    }

    if (query.dimension === 'branch') {
      const [txGroups, branchList] = await Promise.all([
        this.prisma.transaction.groupBy({
          by: ['branchId'],
          where: {
            branchId: { in: branchIds },
            status: 'COMPLETED',
            ...(Object.keys(txDateFilter).length ? { transactionDate: txDateFilter } : {}),
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.branch.findMany({
          where: { id: { in: branchIds } },
          select: { id: true, name: true, code: true },
        }),
      ]);

      const branchNameMap = new Map(branchList.map((b) => [b.id, b.name]));

      return txGroups.map((g) => ({
        branchId: g.branchId,
        name: branchNameMap.get(g.branchId) ?? 'Unknown Branch',
        amount: Number(g._sum.amount?.toFixed(2) ?? 0),
        count: g._count._all,
      }));
    }

    if (query.dimension === 'category') {
      const groups = await this.prisma.serviceTicket.groupBy({
        by: ['category'],
        where: {
          branchId: { in: branchIds },
          ...(Object.keys(ticketDateFilter).length ? { openedAt: ticketDateFilter } : {}),
        },
        _count: { _all: true },
      });

      return groups.map((g) => ({
        name: g.category,
        count: g._count._all,
      }));
    }

    if (query.dimension === 'priority') {
      const groups = await this.prisma.serviceTicket.groupBy({
        by: ['priority'],
        where: {
          branchId: { in: branchIds },
          ...(Object.keys(ticketDateFilter).length ? { openedAt: ticketDateFilter } : {}),
        },
        _count: { _all: true },
      });

      return groups.map((g) => ({
        name: g.priority,
        count: g._count._all,
      }));
    }

    return [];
  }

  async getPreferences(user: AuthenticatedUser) {
    const preference = await this.prisma.dashboardPreference.findUnique({
      where: { userId: user.userId },
    });

    if (!preference) {
      return {
        userId: user.userId,
        widgetsJson: {
          version: 1,
          visibleCards: [
            'totalTickets',
            'openTickets',
            'resolvedTickets',
            'avgResolutionTime',
            'transactionTotal',
            'transactionCount',
          ],
          visibleCharts: [
            'ticketStatusBreakdown',
            'monthlyTrend',
            'branchTransactions',
          ],
          cardOrder: [
            'totalTickets',
            'openTickets',
            'resolvedTickets',
            'avgResolutionTime',
            'transactionTotal',
            'transactionCount',
          ],
        },
      };
    }

    return preference;
  }

  async updatePreferences(user: AuthenticatedUser, widgetsJson: Record<string, any>) {
    return this.prisma.dashboardPreference.upsert({
      where: { userId: user.userId },
      update: { widgetsJson },
      create: {
        userId: user.userId,
        widgetsJson,
      },
    });
  }
}
