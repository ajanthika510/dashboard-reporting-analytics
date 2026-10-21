export type UserRole = 'ADMINISTRATOR' | 'MANAGER' | 'ANALYST' | 'VIEWER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  isActive: boolean;
}

export interface DashboardSummary {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number;
  transactionTotal: number;
  transactionCount: number;
  branchCount: number;
  generatedAt: string;
}

export interface TrendPoint {
  period: string;
  ticketCount: number;
  transactionCount: number;
  transactionTotal: number;
}

export interface BreakdownItem {
  name: string;
  count?: number;
  amount?: number;
  percentage?: number;
  branchId?: string;
}

export interface DatasetDimension {
  key: string;
  label: string;
  type: string;
  options?: string[];
}

export interface DatasetMetric {
  key: string;
  label: string;
  field: string;
}

export interface DatasetMetadata {
  key: string;
  label: string;
  description: string;
  dateField: string;
  dimensions: DatasetDimension[];
  metrics: DatasetMetric[];
  filterableFields: string[];
}

export interface ReportPreviewRow {
  groupKey: string;
  label: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  metricValue: number;
}

export interface ReportPreviewResult {
  dataset: string;
  dimension: string;
  metric: string;
  columns: { key: string; label: string }[];
  rows: ReportPreviewRow[];
  totalRows: number;
  page: number;
  pageSize: number;
  summary: {
    totalGroups: number;
    totalCount: number;
    totalSum: number;
    avgValue: number;
  };
  chartData: { name: string; value: number }[];
}

export interface SavedReport {
  id: string;
  title: string;
  dataset: string;
  configJson: Record<string, any>;
  visibility: 'PRIVATE' | 'SHARED';
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExportLogItem {
  id: string;
  actorId: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reportId?: string | null;
  report?: {
    id: string;
    title: string;
  } | null;
  dataset: string;
  filtersJson?: Record<string, any> | null;
  rowCount: number;
  createdAt: string;
}

export interface DashboardWidgetsPreference {
  version: number;
  visibleCards: string[];
  visibleCharts: string[];
  cardOrder: string[];
}

export interface AdminDataPreview {
  overview: {
    branches: number;
    staff: number;
    tickets: number;
    transactions: number;
    users: number;
    dataFreshness: {
      ticketsLastUpdated: string | null;
      transactionsLastUpdated: string | null;
      staffLastUpdated: string | null;
      checkedAt: string;
    };
  };
  activeDataset: string;
  totalRecords: number;
  limit: number;
  offset: number;
  records: any[];
}

export type DashboardPage =
  | 'Overview'
  | 'Report explorer'
  | 'Saved reports'
  | 'Dashboard settings'
  | 'Export history'
  | 'Admin data preview';

export interface DashboardOutletContext {
  user: AuthUser;
  summary: DashboardSummary | null;
  trends: TrendPoint[];
  statusBreakdown: BreakdownItem[];
  branchBreakdown: BreakdownItem[];
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (val: string) => void;
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  busy: boolean;
  error: string;
  notice: string;
  setError: (value: string) => void;
  setNotice: (value: string) => void;
  loadDashboardData: () => Promise<void>;
  preferences: DashboardWidgetsPreference | null;
  updatePreferences: (prefs: DashboardWidgetsPreference) => Promise<void>;
}
