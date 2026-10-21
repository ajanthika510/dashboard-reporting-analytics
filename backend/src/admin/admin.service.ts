import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDataPreview(dataset?: string, limit = 20, offset = 0) {
    const [
      branchCount,
      staffCount,
      ticketCount,
      txCount,
      userCount,
      latestTicket,
      latestTx,
      latestStaff,
    ] = await Promise.all([
      this.prisma.branch.count(),
      this.prisma.staff.count(),
      this.prisma.serviceTicket.count(),
      this.prisma.transaction.count(),
      this.prisma.user.count(),
      this.prisma.serviceTicket.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      this.prisma.transaction.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      this.prisma.staff.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    ]);

    const activeDataset = dataset || 'branches';
    let records: any[] = [];
    let totalRecords = 0;

    switch (activeDataset) {
      case 'staff':
        totalRecords = staffCount;
        records = await this.prisma.staff.findMany({
          include: { branch: { select: { name: true, code: true } } },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        });
        break;

      case 'tickets':
      case 'ServiceTicket':
        totalRecords = ticketCount;
        records = await this.prisma.serviceTicket.findMany({
          include: {
            branch: { select: { name: true } },
            assignedStaff: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        });
        break;

      case 'transactions':
      case 'Transaction':
        totalRecords = txCount;
        records = await this.prisma.transaction.findMany({
          include: {
            branch: { select: { name: true } },
            staff: { select: { name: true } },
          },
          orderBy: { transactionDate: 'desc' },
          skip: offset,
          take: limit,
        });
        break;

      case 'users':
        totalRecords = userCount;
        records = await this.prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            branchId: true,
            createdAt: true,
            branch: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        });
        break;

      case 'branches':
      default:
        totalRecords = branchCount;
        records = await this.prisma.branch.findMany({
          include: {
            _count: {
              select: {
                users: true,
                staff: true,
                serviceTickets: true,
                transactions: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          skip: offset,
          take: limit,
        });
        break;
    }

    return {
      overview: {
        branches: branchCount,
        staff: staffCount,
        tickets: ticketCount,
        transactions: txCount,
        users: userCount,
        dataFreshness: {
          ticketsLastUpdated: latestTicket?.createdAt || null,
          transactionsLastUpdated: latestTx?.createdAt || null,
          staffLastUpdated: latestStaff?.createdAt || null,
          checkedAt: new Date().toISOString(),
        },
      },
      activeDataset,
      totalRecords,
      limit,
      offset,
      records,
    };
  }
}
