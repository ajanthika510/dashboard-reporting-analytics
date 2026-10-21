import {
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  LifeBuoy,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { useDashboardContext } from '../layouts/DashboardLayout'
import DateRangeFilter from '../components/DateRangeFilter'
import MetricCard from '../components/MetricCard'
import Charts from '../components/Charts'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function OverviewPage() {
  const {
    summary,
    trends,
    statusBreakdown,
    branchBreakdown,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    busy,
    loadDashboardData,
    preferences,
    error,
  } = useDashboardContext()

  const visibleCards = preferences?.visibleCards ?? [
    'totalTickets',
    'openTickets',
    'resolvedTickets',
    'avgResolutionTime',
    'transactionTotal',
    'transactionCount',
  ]

  const visibleCharts = preferences?.visibleCharts ?? [
    'ticketStatusBreakdown',
    'monthlyTrend',
    'branchTransactions',
  ]

  const cardOrder = preferences?.cardOrder ?? [
    'totalTickets',
    'openTickets',
    'resolvedTickets',
    'avgResolutionTime',
    'transactionTotal',
    'transactionCount',
  ]

  const renderCard = (key: string) => {
    switch (key) {
      case 'totalTickets':
        return (
          <MetricCard
            key="totalTickets"
            label="Total Tickets"
            value={summary ? summary.totalTickets.toLocaleString() : '—'}
            note="All statuses in range"
            icon={<FileText size={19} />}
            accent="blue"
          />
        )
      case 'openTickets':
        return (
          <MetricCard
            key="openTickets"
            label="Open Tickets"
            value={summary ? summary.openTickets.toLocaleString() : '—'}
            note="New, Assigned, In Progress"
            icon={<LifeBuoy size={19} />}
            accent="amber"
          />
        )
      case 'resolvedTickets':
        return (
          <MetricCard
            key="resolvedTickets"
            label="Resolved Tickets"
            value={summary ? summary.resolvedTickets.toLocaleString() : '—'}
            note="Resolved or Closed"
            icon={<CheckCircle2 size={19} />}
            accent="green"
          />
        )
      case 'avgResolutionTime':
        return (
          <MetricCard
            key="avgResolutionTime"
            label="Avg Resolution Time"
            value={summary ? `${summary.avgResolutionTimeHours} hrs` : '—'}
            note="Closed vs Opened duration"
            icon={<Clock3 size={19} />}
            accent="violet"
          />
        )
      case 'transactionTotal':
        return (
          <MetricCard
            key="transactionTotal"
            label="Transaction Revenue"
            value={summary ? formatMoney(summary.transactionTotal) : '—'}
            note="Completed sales and retainers"
            icon={<DollarSign size={19} />}
            accent="green"
          />
        )
      case 'transactionCount':
        return (
          <MetricCard
            key="transactionCount"
            label="Completed Transactions"
            value={summary ? summary.transactionCount.toLocaleString() : '—'}
            note="Excludes cancelled entries"
            icon={<TrendingUp size={19} />}
            accent="blue"
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR BUSINESS AT A GLANCE</p>
          <h1>Overview Dashboard</h1>
          <p className="muted">
            Derive real-time KPIs and trends from your operational records.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() => void loadDashboardData()}
            disabled={busy}
          >
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            {busy ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        branches={branches}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        onApply={() => void loadDashboardData()}
        busy={busy}
      />

      {error && (
        <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '20px' }}>
          <strong>Error loading dashboard:</strong> {error}
        </div>
      )}

      <div className="section-caption">
        <span>PERFORMANCE METRICS</span>
        <span className="muted">
          {summary ? `Scope: ${summary.branchCount} accessible branch(es)` : 'Loading scope…'}
        </span>
      </div>

      <section
        className="metric-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '26px',
        }}
      >
        {cardOrder
          .filter((k) => visibleCards.includes(k))
          .map((k) => renderCard(k))}
      </section>

      <Charts
        statusBreakdown={statusBreakdown}
        branchBreakdown={branchBreakdown}
        trends={trends}
        visibleCharts={visibleCharts}
        loading={busy}
      />

      <div className="data-footnote" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', marginTop: '16px' }}>
        <Clock3 size={14} />
        {summary
          ? `Data synchronized at ${new Date(summary.generatedAt).toLocaleTimeString()} · All KPIs computed in PostgreSQL`
          : busy
            ? 'Calculating analytics…'
            : 'Operational metrics pending load.'}
      </div>
    </>
  )
}
