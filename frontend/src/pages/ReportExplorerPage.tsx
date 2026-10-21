import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  BarChart2,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Play,
  Table as TableIcon,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, downloadCsv } from '../api'
import type {
  DatasetMetadata,
  ReportPreviewResult,
} from '../types'
import { useDashboardContext } from '../layouts/DashboardLayout'

export default function ReportExplorerPage() {
  const { user, branches, setError, setNotice } = useDashboardContext()

  const [datasets, setDatasets] = useState<DatasetMetadata[]>([])
  const [selectedDataset, setSelectedDataset] = useState('ServiceTicket')
  const [dimension, setDimension] = useState('branch')
  const [metric, setMetric] = useState<'count' | 'sum' | 'avg'>('count')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [sortBy, setSortBy] = useState<'label' | 'value'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [busy, setBusy] = useState(false)
  const [reportResult, setReportResult] = useState<ReportPreviewResult | null>(null)
  const [showChart, setShowChart] = useState(true)

  // Save Report Modal
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportVisibility, setReportVisibility] = useState<'PRIVATE' | 'SHARED'>('PRIVATE')
  const [savingReport, setSavingReport] = useState(false)

  // Load dataset metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await api<{ datasets: DatasetMetadata[] }>('/reporting/datasets')
        setDatasets(res.datasets)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dataset metadata.')
      }
    }
    void loadMeta()
  }, [setError])

  const currentDatasetMeta = datasets.find((d) => d.key === selectedDataset)

  const runPreview = async (newPage = page) => {
    setBusy(true)
    setError('')
    try {
      const filters: Record<string, any> = {}
      if (filterBranchId) filters.branchId = filterBranchId
      if (filterStatus) filters.status = filterStatus

      const res = await api<ReportPreviewResult>('/reports/preview', {
        method: 'POST',
        body: JSON.stringify({
          dataset: selectedDataset,
          dimension,
          metric,
          from: from || undefined,
          to: to || undefined,
          filters,
          sortBy,
          sortOrder,
          page: newPage,
          pageSize,
        }),
      })
      setReportResult(res)
      setPage(newPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report execution failed.')
    } finally {
      setBusy(false)
    }
  }

  // Auto-run first preview when metadata arrives
  useEffect(() => {
    if (datasets.length > 0 && !reportResult) {
      void runPreview(1)
    }
  }, [datasets])

  const handleExportCsv = async () => {
    if (user.role === 'VIEWER') {
      setError('Viewers do not have export permissions.')
      return
    }

    setBusy(true)
    try {
      const filters: Record<string, any> = {}
      if (filterBranchId) filters.branchId = filterBranchId
      if (filterStatus) filters.status = filterStatus

      const count = await downloadCsv(
        '/reports/export',
        `${selectedDataset.toLowerCase()}-${dimension}-export.csv`,
        {
          method: 'POST',
          body: JSON.stringify({
            dataset: selectedDataset,
            dimension,
            metric,
            from: from || undefined,
            to: to || undefined,
            filters,
          }),
        },
      )
      setNotice(`CSV exported successfully · ${count ?? 0} rows written.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV export failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportTitle.trim()) return

    setSavingReport(true)
    try {
      const filters: Record<string, any> = {}
      if (filterBranchId) filters.branchId = filterBranchId
      if (filterStatus) filters.status = filterStatus

      await api('/reports/saved', {
        method: 'POST',
        body: JSON.stringify({
          title: reportTitle.trim(),
          dataset: selectedDataset,
          configJson: {
            dimension,
            metric,
            from: from || null,
            to: to || null,
            filters,
            sortBy,
            sortOrder,
          },
          visibility: reportVisibility,
        }),
      })

      setNotice(`Report "${reportTitle}" saved successfully.`)
      setSaveModalOpen(false)
      setReportTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report definition.')
    } finally {
      setSavingReport(false)
    }
  }

  const totalPages = reportResult ? Math.ceil(reportResult.totalRows / pageSize) : 1

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOM ANALYTICS</p>
          <h1>Report Explorer</h1>
          <p className="muted">
            Build, slice, and export database-backed reports with granular controls.
          </p>
        </div>

        <div className="heading-actions">
          {user.role !== 'VIEWER' && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSaveModalOpen(true)}
              disabled={!reportResult}
            >
              <BookmarkPlus size={16} />
              Save Report
            </button>
          )}

          {user.role !== 'VIEWER' && (
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleExportCsv()}
              disabled={busy || !reportResult}
            >
              <ArrowDownToLine size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Query Builder Controls */}
      <section className="content-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
          <Filter size={18} style={{ color: '#3b82f6' }} />
          <span>Report Configuration</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {/* Dataset */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              DATASET
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => {
                const next = e.target.value
                setSelectedDataset(next)
                if (next === 'Transaction' && (dimension === 'assignedStaff' || dimension === 'priority')) {
                  setDimension('branch')
                }
              }}
              style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }}
            >
              <option value="ServiceTicket">Service Tickets</option>
              <option value="Transaction">Transactions</option>
            </select>
          </div>

          {/* Group By Dimension */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              GROUP BY DIMENSION
            </label>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }}
            >
              {currentDatasetMeta?.dimensions.map((dim) => (
                <option key={dim.key} value={dim.key}>
                  {dim.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              METRIC AGGREGATION
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as any)}
              style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }}
            >
              <option value="count">Count of Records</option>
              <option value="sum">Sum of Amount (LKR)</option>
              <option value="avg">Average Amount (LKR)</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              BRANCH FILTER
            </label>
            <select
              value={filterBranchId}
              onChange={(e) => setFilterBranchId(e.target.value)}
              style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters & Specific Dimensions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              FROM DATE
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ width: '100%', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px', fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              TO DATE
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ width: '100%', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px', fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
              STATUS FILTER
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 8px', fontSize: '12px' }}
            >
              <option value="">All Statuses</option>
              {selectedDataset === 'ServiceTicket' ? (
                <>
                  <option value="NEW">New</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              ) : (
                <>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="FAILED">Failed</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => void runPreview(1)}
              disabled={busy}
              style={{ width: '100%', height: '34px' }}
            >
              <Play size={15} />
              {busy ? 'Running Query…' : 'Generate Report'}
            </button>
          </div>
        </div>
      </section>

      {/* Summary Metrics */}
      {reportResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DISTINCT GROUPS</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#1e293b' }}>
              {reportResult.summary.totalGroups}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL COUNT</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#3b82f6' }}>
              {reportResult.summary.totalCount.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL SUM</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>
              Rs {reportResult.summary.totalSum.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>GROUP AVERAGE</span>
            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#8b5cf6' }}>
              Rs {reportResult.summary.avgValue.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Optional Chart Preview */}
      {reportResult && reportResult.chartData.length > 0 && showChart && (
        <section className="content-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Aggregated Chart Preview</h2>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                Visualizing top groups by {metric === 'count' ? 'record count' : 'total amount'}
              </p>
            </div>
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart2 size={14} /> Toggle Chart
            </button>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportResult.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" name="Metric Value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Tabular Result View */}
      <section className="content-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TableIcon size={17} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Report Data Table</h2>
            {reportResult && (
              <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                {reportResult.totalRows} records
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Sort:
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any)
                  void runPreview(page)
                }}
                style={{ height: '28px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }}
              >
                <option value="value">Metric Value</option>
                <option value="label">Group Name</option>
              </select>
            </label>

            <label style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Order:
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as any)
                  void runPreview(page)
                }}
                style={{ height: '28px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
          </div>
        </div>

        {reportResult && reportResult.rows.length > 0 ? (
          <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>
                    {dimension.toUpperCase()}
                  </th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>RECORD COUNT</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>TOTAL AMOUNT (LKR)</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>AVERAGE (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {reportResult.rows.map((row) => (
                  <tr key={row.groupKey} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{row.label}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#334155' }}>
                      {row.count.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                      Rs {row.totalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>
                      Rs {row.avgAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Page {page} of {totalPages || 1} ({reportResult.totalRows} total items)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value)
                    setPageSize(newSize)
                    void runPreview(1)
                  }}
                  style={{ height: '28px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', padding: '0 6px' }}
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                </select>
                <button
                  type="button"
                  className="secondary-button small-button"
                  onClick={() => void runPreview(page - 1)}
                  disabled={page <= 1 || busy}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="secondary-button small-button"
                  onClick={() => void runPreview(page + 1)}
                  disabled={page >= totalPages || busy}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
            {busy ? 'Running query…' : 'No records match the selected parameters.'}
          </div>
        )}
      </section>

      {/* Save Report Modal */}
      {saveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '24px',
              width: 'min(90vw, 460px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px' }}>Save Report Configuration</h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 18px' }}>
              Save your current filters, metrics, and groupings for quick re-use.
            </p>

            <form onSubmit={handleSaveReport}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g., Weekly Ticket Volume by Branch"
                  style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 10px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Visibility
                </label>
                <select
                  value={reportVisibility}
                  onChange={(e) => setReportVisibility(e.target.value as any)}
                  style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 10px', fontSize: '13px' }}
                >
                  <option value="PRIVATE">Private (Only visible to you)</option>
                  <option value="SHARED">Shared (Visible to other workspace members)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSaveModalOpen(false)}
                  disabled={savingReport}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingReport || !reportTitle.trim()}
                >
                  {savingReport ? 'Saving…' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
