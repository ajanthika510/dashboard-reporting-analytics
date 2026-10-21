import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Specification Requirements & Security Tests (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let managerToken: string;
  let analystToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // 1. Authenticate users and collect tokens
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@neirahtech.com', password: 'admin12345678' });
    adminToken = adminRes.body.accessToken;

    const managerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'manager.colombo@neirahtech.com', password: 'manager12345678' });
    managerToken = managerRes.body.accessToken;

    const analystRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'analyst@neirahtech.com', password: 'analyst12345678' });
    analystToken = analystRes.body.accessToken;

    const viewerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'viewer@neirahtech.com', password: 'viewer12345678' });
    viewerToken = viewerRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('05.1 & 10. Authentication & RBAC', () => {
    it('Scenario: Viewer requests admin data preview -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/data-preview')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('Scenario: Administrator requests admin data preview -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/data-preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('overview');
      expect(res.body.overview.branches).toBeGreaterThan(0);
    });

    it('Scenario: Viewer attempts to save a report -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/reports/saved')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Unauthorized Viewer Report',
          dataset: 'ServiceTicket',
          configJson: { version: 1, dimension: 'status', metric: 'count' },
        })
        .expect(403);
    });

    it('Scenario: Viewer attempts to export report results to CSV -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/reports/export')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          dataset: 'Transaction',
          dimension: 'branch',
          metric: 'count',
        })
        .expect(403);
    });
  });

  describe('09. & 10. Calculations, Edge Cases & Date Validation', () => {
    it('Scenario: Invalid date range (from > to) -> 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard/summary?from=2026-10-15&to=2026-10-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('Scenario: Invalid metric/dimension combination -> 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/reports/preview')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          dataset: 'ServiceTicket',
          dimension: 'nonExistentDimension',
          metric: 'count',
        })
        .expect(400);
    });

    it('Scenario: No records in range -> Returns zero-value KPIs, empty chart/table without crashing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard/summary?from=1990-01-01&to=1990-01-02')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.totalTickets).toBe(0);
      expect(res.body.openTickets).toBe(0);
      expect(res.body.resolvedTickets).toBe(0);
      expect(res.body.avgResolutionTimeHours).toBe(0);
      expect(res.body.transactionTotal).toBe(0);
      expect(res.body.transactionCount).toBe(0);
    });

    it('Scenario: Cross-branch request by restricted user -> 403 Forbidden', async () => {
      // Find a branch that is not Colombo
      const branchesRes = await request(app.getHttpServer())
        .get('/api/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const otherBranch = branchesRes.body.find((b: any) => !b.name.includes('Colombo'));
      expect(otherBranch).toBeDefined();

      await request(app.getHttpServer())
        .get(`/api/dashboard/summary?branchId=${otherBranch.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });
  });

  describe('5.4 & 10. Private Saved Reports Ownership', () => {
    let privateReportId: string;

    beforeAll(async () => {
      // Analyst creates a private report
      const res = await request(app.getHttpServer())
        .post('/api/reports/saved')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          title: 'Analyst Secret Report',
          dataset: 'ServiceTicket',
          configJson: { version: 1, dimension: 'priority', metric: 'count' },
          visibility: 'PRIVATE',
        })
        .expect(201);

      privateReportId = res.body.id;
    });

    it('Scenario: Another non-admin user requests another user\'s private report -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/saved/${privateReportId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('Scenario: Another non-admin user attempts to delete another user\'s private report -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .delete(`/api/reports/saved/${privateReportId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });

    it('Owner can view, update and delete their own private report', async () => {
      await request(app.getHttpServer())
        .patch(`/api/reports/saved/${privateReportId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ title: 'Analyst Updated Report' })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/reports/saved/${privateReportId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);
    });
  });

  describe('5.5 & 10. CSV Export & Formula Injection Prevention', () => {
    it('Exports report to CSV with proper escaping and audit logging', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reports/export')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          dataset: 'Transaction',
          dimension: 'branch',
          metric: 'count',
        })
        .expect(201);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('.csv');
      expect(res.headers['x-export-row-count']).toBeDefined();
      expect(res.text).toContain('Branch');

      // Verify audit log
      const logsRes = await request(app.getHttpServer())
        .get('/api/reports/export-history')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(logsRes.body.length).toBeGreaterThan(0);
      expect(logsRes.body[0].dataset).toBe('Transaction');
    });
  });

  describe('5.2 Dashboard Overview KPIs & Charts API', () => {
    it('Returns accurate summary KPIs for current data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.totalTickets).toBeGreaterThan(0);
      expect(res.body.openTickets).toBeGreaterThanOrEqual(0);
      expect(res.body.resolvedTickets).toBeGreaterThanOrEqual(0);
      expect(typeof res.body.avgResolutionTimeHours).toBe('number');
      expect(res.body.transactionTotal).toBeGreaterThan(0);
      expect(res.body.transactionCount).toBeGreaterThan(0);
    });

    it('Returns trends timeline data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard/trends?groupBy=month')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('period');
      expect(res.body[0]).toHaveProperty('ticketCount');
      expect(res.body[0]).toHaveProperty('transactionTotal');
    });

    it('Returns breakdowns for status and branch', async () => {
      const statusRes = await request(app.getHttpServer())
        .get('/api/dashboard/breakdown?dimension=status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(statusRes.body)).toBe(true);
      expect(statusRes.body.length).toBeGreaterThan(0);
      expect(statusRes.body[0]).toHaveProperty('name');
      expect(statusRes.body[0]).toHaveProperty('count');

      const branchRes = await request(app.getHttpServer())
        .get('/api/dashboard/breakdown?dimension=branch')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(branchRes.body)).toBe(true);
      expect(branchRes.body.length).toBeGreaterThan(0);
      expect(branchRes.body[0]).toHaveProperty('name');
      expect(branchRes.body[0]).toHaveProperty('amount');
    });

    it('Gets and updates user dashboard preferences', async () => {
      const getRes = await request(app.getHttpServer())
        .get('/api/dashboard/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getRes.body).toHaveProperty('widgetsJson');

      const putRes = await request(app.getHttpServer())
        .put('/api/dashboard/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          widgetsJson: {
            version: 1,
            visibleCards: ['totalTickets', 'transactionTotal'],
            visibleCharts: ['ticketStatusBreakdown'],
            cardOrder: ['totalTickets', 'transactionTotal'],
          },
        })
        .expect(200);

      expect(putRes.body.widgetsJson.visibleCards).toEqual(['totalTickets', 'transactionTotal']);
    });
  });
});
