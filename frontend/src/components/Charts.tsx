import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'
import type { BreakdownItem, TrendPoint } from '../types'

interface ChartsProps {
  statusBreakdown: BreakdownItem[]
  branchBreakdown: BreakdownItem[]
  trends: TrendPoint[]
  visibleCharts?: string[]
  loading: boolean
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  ASSIGNED: '#8b5cf6',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
  CANCELLED: '#ef4444',
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

export default function Charts({
  statusBreakdown,
  branchBreakdown,
  trends,
  visibleCharts = ['ticketStatusBreakdown', 'monthlyTrend', 'branchTransactions'],
  loading,
}: ChartsProps) {
  const showStatus = visibleCharts.includes('ticketStatusBreakdown')
  const showTrend = visibleCharts.includes('monthlyTrend')
  const showBranch = visibleCharts.includes('branchTransactions')

  const formattedBranchData = branchBreakdown.map((item) => ({
    name: item.name.replace(' Branch', '').replace(' Head Office', ' HQ'),
    amount: item.amount ?? 0,
    count: item.count ?? 0,
  }))

  const formattedStatusData = statusBreakdown.map((item) => ({
    name: item.name.replace(/_/g, ' '),
    rawName: item.name,
    value: item.count ?? 0,
    percentage: item.percentage ?? 0,
  }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
      {/* Chart 1: Ticket Status Breakdown (Donut/Pie) */}
      {showStatus && (
        <article className="content-panel" style={{ padding: '20px' }}>
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Ticket Status Breakdown</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Distribution across operational workload
              </p>
            </div>
            <span className="panel-icon"><PieIcon size={18} /></span>
          </div>

          {formattedStatusData.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {formattedStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.rawName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} tickets`, name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span style={{ fontSize: 11, color: '#475569' }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart" style={{ height: 260, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
              <span>{loading ? 'Loading status data…' : 'No ticket records in range'}</span>
            </div>
          )}
        </article>
      )}

      {/* Chart 2: Monthly Volume Trend (Line Chart) */}
      {showTrend && (
        <article className="content-panel" style={{ padding: '20px' }}>
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Monthly Volume Trend</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Service tickets vs. completed transactions over time
              </p>
            </div>
            <span className="panel-icon"><TrendingUp size={18} /></span>
          </div>

          {trends.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span style={{ fontSize: 11, color: '#475569' }}>{val}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="ticketCount"
                    name="Service Tickets"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="transactionCount"
                    name="Transactions"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart" style={{ height: 260, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
              <span>{loading ? 'Loading trend data…' : 'No trend records in range'}</span>
            </div>
          )}
        </article>
      )}

      {/* Chart 3: Transaction Totals by Branch (Bar Chart) */}
      {showBranch && (
        <article className="content-panel" style={{ padding: '20px' }}>
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Transaction Totals by Branch</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Completed transaction revenue (LKR)
              </p>
            </div>
            <span className="panel-icon"><BarChart3 size={18} /></span>
          </div>

          {formattedBranchData.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedBranchData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `Rs ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, 'Total Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar
                    dataKey="amount"
                    name="Completed Revenue"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart" style={{ height: 260, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
              <span>{loading ? 'Loading branch data…' : 'No branch records in range'}</span>
            </div>
          )}
        </article>
      )}
    </div>
  )
}
