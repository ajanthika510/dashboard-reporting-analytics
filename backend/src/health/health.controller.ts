import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserRole,
  TicketStatus,
  TicketPriority,
  TransactionStatus,
  ReportVisibility,
} from '../generated/prisma/client';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const usersCount = await this.prisma.user.count();

      return {
        status: 'ok',
        database: 'connected',
        usersCount,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
      });
    }
  }

  @Get('seed')
  async seed() {
    // 1. Seed Branches
    const colombo = await this.prisma.branch.upsert({
      where: { code: 'HQ-COL' },
      update: {},
      create: {
        name: 'Colombo Head Office',
        code: 'HQ-COL',
        location: 'Colombo 03, Western Province',
        isActive: true,
      },
    });

    const kandy = await this.prisma.branch.upsert({
      where: { code: 'BR-KND' },
      update: {},
      create: {
        name: 'Kandy Regional Branch',
        code: 'BR-KND',
        location: 'Dalada Veediya, Kandy',
        isActive: true,
      },
    });

    const galle = await this.prisma.branch.upsert({
      where: { code: 'BR-GAL' },
      update: {},
      create: {
        name: 'Galle Coastal Branch',
        code: 'BR-GAL',
        location: 'Fort, Galle',
        isActive: true,
      },
    });

    const jaffnaInactive = await this.prisma.branch.upsert({
      where: { code: 'BR-JAF' },
      update: {},
      create: {
        name: 'Jaffna Northern Branch (Inactive)',
        code: 'BR-JAF',
        location: 'Hospital Road, Jaffna',
        isActive: false,
      },
    });

    // 2. Seed Staff members
    const staffData = [
      { name: 'Kasun Perera', email: 'kasun.p@neirahtech.com', branchId: colombo.id },
      { name: 'Nimali Fernando', email: 'nimali.f@neirahtech.com', branchId: colombo.id },
      { name: 'Dulan Jayawardena', email: 'dulan.j@neirahtech.com', branchId: colombo.id },
      { name: 'Amara Wickramasinghe', email: 'amara.w@neirahtech.com', branchId: colombo.id },
      { name: 'Buddhika Senanayake', email: 'buddhika.s@neirahtech.com', branchId: kandy.id },
      { name: 'Chathurika Silva', email: 'chathurika.s@neirahtech.com', branchId: kandy.id },
      { name: 'Roshan Bandara', email: 'roshan.b@neirahtech.com', branchId: kandy.id },
      { name: 'Tharindu De Silva', email: 'tharindu.d@neirahtech.com', branchId: galle.id },
      { name: 'Manel Gunaratne', email: 'manel.g@neirahtech.com', branchId: galle.id },
      { name: 'Kavitha Rajendran', email: 'kavitha.r@neirahtech.com', branchId: jaffnaInactive.id },
    ];

    const seededStaff = [];
    for (const s of staffData) {
      const existing = await this.prisma.staff.findFirst({ where: { email: s.email } });
      if (!existing) {
        const created = await this.prisma.staff.create({ data: s });
        seededStaff.push(created);
      } else {
        seededStaff.push(existing);
      }
    }

    // 3. Seed Users
    const defaultPasswordHash = await bcrypt.hash('admin12345678', 10);
    const managerPasswordHash = await bcrypt.hash('manager12345678', 10);
    const analystPasswordHash = await bcrypt.hash('analyst12345678', 10);
    const viewerPasswordHash = await bcrypt.hash('viewer12345678', 10);

    const usersData = [
      {
        email: 'admin@neirahtech.com',
        name: 'System Administrator',
        passwordHash: defaultPasswordHash,
        role: UserRole.ADMINISTRATOR,
        branchId: null,
      },
      {
        email: 'manager.colombo@neirahtech.com',
        name: 'Colombo Branch Manager',
        passwordHash: managerPasswordHash,
        role: UserRole.MANAGER,
        branchId: colombo.id,
      },
      {
        email: 'manager.global@neirahtech.com',
        name: 'Global Operations Manager',
        passwordHash: managerPasswordHash,
        role: UserRole.MANAGER,
        branchId: null,
      },
      {
        email: 'analyst@neirahtech.com',
        name: 'Lead Data Analyst',
        passwordHash: analystPasswordHash,
        role: UserRole.ANALYST,
        branchId: null,
      },
      {
        email: 'viewer@neirahtech.com',
        name: 'Operations Viewer',
        passwordHash: viewerPasswordHash,
        role: UserRole.VIEWER,
        branchId: null,
      },
    ];

    const seededUsers = [];
    for (const u of usersData) {
      const user = await this.prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          branchId: u.branchId,
          isActive: true,
        },
        create: u,
      });
      seededUsers.push(user);
    }

    const adminUser = seededUsers[0];
    const analystUser = seededUsers[3];

    // 4. Seed Service Tickets
    const branches = [colombo, kandy, galle];
    const now = new Date();
    const ticketSpecs = [
      { daysAgo: 95, hoursToClose: 14, status: TicketStatus.CLOSED, priority: TicketPriority.HIGH, category: 'Billing', branchIdx: 0, amount: '15000.00' },
      { daysAgo: 90, hoursToClose: 26, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, category: 'Technical Support', branchIdx: 1, amount: '24500.00' },
      { daysAgo: 85, hoursToClose: 8, status: TicketStatus.CLOSED, priority: TicketPriority.NORMAL, category: 'Hardware Inquiry', branchIdx: 2, amount: '8000.00' },
      { daysAgo: 80, hoursToClose: 48, status: TicketStatus.CLOSED, priority: TicketPriority.NORMAL, category: 'Account Access', branchIdx: 0, amount: '3500.00' },
      { daysAgo: 75, hoursToClose: 18, status: TicketStatus.RESOLVED, priority: TicketPriority.HIGH, category: 'Network Integration', branchIdx: 1, amount: '42000.00' },
      { daysAgo: 70, hoursToClose: 32, status: TicketStatus.CLOSED, priority: TicketPriority.LOW, category: 'Billing', branchIdx: 2, amount: '6200.00' },
      { daysAgo: 65, hoursToClose: 12, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, category: 'Technical Support', branchIdx: 0, amount: '18500.00' },
      { daysAgo: 60, hoursToClose: 20, status: TicketStatus.CLOSED, priority: TicketPriority.NORMAL, category: 'Hardware Inquiry', branchIdx: 1, amount: '11000.00' },
      { daysAgo: 55, hoursToClose: 72, status: TicketStatus.CLOSED, priority: TicketPriority.HIGH, category: 'Account Access', branchIdx: 2, amount: '4500.00' },
      { daysAgo: 50, hoursToClose: 16, status: TicketStatus.RESOLVED, priority: TicketPriority.NORMAL, category: 'Network Integration', branchIdx: 0, amount: '38000.00' },
      { daysAgo: 45, hoursToClose: 28, status: TicketStatus.CLOSED, priority: TicketPriority.URGENT, category: 'Billing', branchIdx: 1, amount: '22000.00' },
      { daysAgo: 40, hoursToClose: 6, status: TicketStatus.RESOLVED, priority: TicketPriority.LOW, category: 'Technical Support', branchIdx: 2, amount: '5400.00' },
      { daysAgo: 35, hoursToClose: 22, status: TicketStatus.CLOSED, priority: TicketPriority.NORMAL, category: 'Hardware Inquiry', branchIdx: 0, amount: '16000.00' },
      { daysAgo: 30, hoursToClose: 19, status: TicketStatus.RESOLVED, priority: TicketPriority.HIGH, category: 'Account Access', branchIdx: 1, amount: '9000.00' },
      { daysAgo: 25, hoursToClose: 36, status: TicketStatus.CLOSED, priority: TicketPriority.NORMAL, category: 'Network Integration', branchIdx: 2, amount: '29000.00' },
      { daysAgo: 20, hoursToClose: 10, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, category: 'Billing', branchIdx: 0, amount: '19500.00' },
      { daysAgo: 15, hoursToClose: 24, status: TicketStatus.CLOSED, priority: TicketPriority.NORMAL, category: 'Technical Support', branchIdx: 1, amount: '14000.00' },
      { daysAgo: 10, hoursToClose: 15, status: TicketStatus.RESOLVED, priority: TicketPriority.HIGH, category: 'Hardware Inquiry', branchIdx: 2, amount: '27500.00' },
      { daysAgo: 8, hoursToClose: 18, status: TicketStatus.CLOSED, priority: TicketPriority.NORMAL, category: 'Account Access', branchIdx: 0, amount: '4000.00' },
      { daysAgo: 5, hoursToClose: 12, status: TicketStatus.RESOLVED, priority: TicketPriority.URGENT, category: 'Network Integration', branchIdx: 1, amount: '52000.00' },
      { daysAgo: 3, hoursToClose: 9, status: TicketStatus.RESOLVED, priority: TicketPriority.NORMAL, category: 'Billing', branchIdx: 2, amount: '8500.00' },
      { daysAgo: 28, hoursToClose: null, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, category: 'Technical Support', branchIdx: 0, amount: '12000.00' },
      { daysAgo: 22, hoursToClose: null, status: TicketStatus.ASSIGNED, priority: TicketPriority.NORMAL, category: 'Billing', branchIdx: 1, amount: '7500.00' },
      { daysAgo: 18, hoursToClose: null, status: TicketStatus.NEW, priority: TicketPriority.LOW, category: 'Hardware Inquiry', branchIdx: 2, amount: '3500.00' },
      { daysAgo: 14, hoursToClose: null, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.URGENT, category: 'Network Integration', branchIdx: 0, amount: '45000.00' },
      { daysAgo: 12, hoursToClose: null, status: TicketStatus.ASSIGNED, priority: TicketPriority.HIGH, category: 'Account Access', branchIdx: 1, amount: '6000.00' },
      { daysAgo: 9, hoursToClose: null, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.NORMAL, category: 'Billing', branchIdx: 2, amount: '11500.00' },
      { daysAgo: 7, hoursToClose: null, status: TicketStatus.NEW, priority: TicketPriority.NORMAL, category: 'Technical Support', branchIdx: 0, amount: '9800.00' },
      { daysAgo: 5, hoursToClose: null, status: TicketStatus.ASSIGNED, priority: TicketPriority.URGENT, category: 'Hardware Inquiry', branchIdx: 1, amount: '31000.00' },
      { daysAgo: 4, hoursToClose: null, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, category: 'Network Integration', branchIdx: 2, amount: '26000.00' },
      { daysAgo: 3, hoursToClose: null, status: TicketStatus.NEW, priority: TicketPriority.NORMAL, category: 'Account Access', branchIdx: 0, amount: '4200.00' },
      { daysAgo: 2, hoursToClose: null, status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, category: 'Billing', branchIdx: 1, amount: '16500.00' },
      { daysAgo: 1, hoursToClose: null, status: TicketStatus.NEW, priority: TicketPriority.URGENT, category: 'Technical Support', branchIdx: 2, amount: '19000.00' },
      { daysAgo: 0, hoursToClose: null, status: TicketStatus.NEW, priority: TicketPriority.NORMAL, category: 'Hardware Inquiry', branchIdx: 0, amount: '8200.00' },
      { daysAgo: 33, hoursToClose: null, status: TicketStatus.CANCELLED, priority: TicketPriority.LOW, category: 'Account Access', branchIdx: 1, amount: '1500.00' },
      { daysAgo: 16, hoursToClose: null, status: TicketStatus.CANCELLED, priority: TicketPriority.NORMAL, category: 'Billing', branchIdx: 2, amount: '2500.00' },
    ];

    let ticketSeq = 100;
    for (const item of ticketSpecs) {
      ticketSeq++;
      const opened = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000);
      const closed = item.hoursToClose !== null
        ? new Date(opened.getTime() + item.hoursToClose * 60 * 60 * 1000)
        : null;

      const branch = branches[item.branchIdx];
      const branchStaff = seededStaff.filter((s) => s.branchId === branch.id);
      const staff = branchStaff[ticketSeq % branchStaff.length];

      await this.prisma.serviceTicket.upsert({
        where: { reference: `TCK-2026-${ticketSeq}` },
        update: {},
        create: {
          reference: `TCK-2026-${ticketSeq}`,
          title: `${item.category} request #${ticketSeq}`,
          category: item.category,
          priority: item.priority,
          status: item.status,
          branchId: branch.id,
          assignedStaffId: staff ? staff.id : null,
          amount: item.amount,
          openedAt: opened,
          closedAt: closed,
          createdAt: opened,
        },
      });
    }

    // 5. Seed Transactions
    const txCategories = ['Software License', 'Support Retainer', 'Hardware Sale', 'Consulting', 'Maintenance Contract'];
    const txAmounts = [
      '12500.00', '28000.50', '45000.00', '6500.00', '82000.00',
      '14500.00', '33000.00', '95000.00', '19000.00', '54000.00',
      '7200.00', '39500.00', '112000.00', '26500.00', '48000.00'
    ];

    let txSeq = 200;
    for (let i = 0; i < 75; i++) {
      txSeq++;
      const daysAgo = Math.floor(Math.random() * 95);
      const branch = branches[i % branches.length];
      const branchStaff = seededStaff.filter((s) => s.branchId === branch.id);
      const staff = branchStaff[i % branchStaff.length];
      const category = txCategories[i % txCategories.length];
      const amount = txAmounts[i % txAmounts.length];
      const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - (i * 3600000));

      let status: TransactionStatus = TransactionStatus.COMPLETED;
      if (i % 10 === 0) status = TransactionStatus.PENDING;
      else if (i % 15 === 0) status = TransactionStatus.CANCELLED;
      else if (i % 25 === 0) status = TransactionStatus.FAILED;

      await this.prisma.transaction.upsert({
        where: { reference: `TXN-2026-${txSeq}` },
        update: {},
        create: {
          reference: `TXN-2026-${txSeq}`,
          branchId: branch.id,
          staffId: staff ? staff.id : null,
          category,
          amount,
          currency: 'LKR',
          status,
          description: `${category} transaction for ${branch.name}`,
          transactionDate: txDate,
          createdAt: txDate,
        },
      });
    }

    // 6. Seed Dashboard Preferences
    await this.prisma.dashboardPreference.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
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
      },
    });

    const userCount = await this.prisma.user.count();

    return {
      status: 'success',
      message: 'Operational dataset seeded successfully!',
      totalUsers: userCount,
      users: seededUsers.map((u) => ({ email: u.email, role: u.role })),
    };
  }
}
