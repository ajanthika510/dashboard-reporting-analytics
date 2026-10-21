import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  Clock,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react'
import { api, downloadCsv } from '../api'
import type { ExportLogItem } from '../types'
import { useDashboardContext } from '../layouts/DashboardLayout'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DataExportsPage() {
  const { user, setError, setNotice } = useDashboardContext()
  const [logs, setLogs] = useState<ExportLogItem[]>([])
  const [busy, setBusy] = useState(false)
  const [exportingDataset, setExportingDataset] = useState<string | null>(null)

  const loadHistory = async () => {
    setBusy(true)
    try {
      const data = await api<ExportLogItem[]>('/reports/export-history')
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load export audit history.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const handleQuickExport = async (dataset: 'Transaction' | 'ServiceTicket') => {
    if (user.role === 'VIEWER') {
      setError('Viewers do not have permission to trigger CSV exports.')
      return
    }

    setExportingDataset(dataset)
    try {
      const count = await downloadCsv(
        '/reports/export',
        `${dataset.toLowerCase()}-full-export.csv`,
        {
          method: 'POST',
          body: JSON.stringify({
            dataset,
            dimension: 'branch',
            metric: 'count',
          }),
        },
      )
      setNotice(`${dataset} dataset exported successfully · ${count ?? 0} rows.`)
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setExportingDataset(null)
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMPLIANCE &amp; AUDIT</p>
          <h1>Export History &amp; Downloads</h1>
          <p className="muted">
            Track authorized report exports, review audit logs, and trigger direct data exports.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() => void loadHistory()}
            disabled={busy}
          >
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            Refresh History
          </button>
        </div>
      </div>

      {user.role === 'VIEWER' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '24px' }}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Export Restrictions Apply</strong>
            <p style={{ margin: '2px 0 0', fontSize: '12px' }}>
              Your current role ({user.role}) has read-only access. Report and raw data exports are restricted by backend RBAC.
            </p>
          </div>
        </div>
      ) : (
        <section className="export-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <article className="content-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#10b981', display: 'grid', placeItems: 'center' }}>
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>Transactions Dataset</strong>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Full financial operational records</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
              Export complete transaction references, amounts, statuses, categories, and branch identifiers with formula injection protection.
            </p>
            <button
              type="button"
              className="primary-button small-button"
              onClick={() => void handleQuickExport('Transaction')}
              disabled={exportingDataset !== null}
            >
              <ArrowDownToLine size={14} />
              {exportingDataset === 'Transaction' ? 'Exporting…' : 'Export Transactions CSV'}
            </button>
          </article>

          <article className="content-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'grid', placeItems: 'center' }}>
                <FileText size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>Service Tickets Dataset</strong>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Operational workload &amp; tickets</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
              Export service tickets, categories, priorities, resolution timestamps, assigned staff, and branch assignments.
            </p>
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => void handleQuickExport('ServiceTicket')}
              disabled={exportingDataset !== null}
            >
              <ArrowDownToLine size={14} />
              {exportingDataset === 'ServiceTicket' ? 'Exporting…' : 'Export Tickets CSV'}
            </button>
          </article>
        </section>
      )}

      {/* Audit Log Table */}
      <section className="content-panel page-panel" style={{ padding: '20px' }}>
        <div className="panel-heading" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Export Audit Log</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Immutable record of who exported what, when, and matching row counts
            </p>
          </div>
        </div>

        {busy && !logs.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading audit history…
          </div>
        ) : logs.length ? (
          <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>EXPORTED BY</th>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>DATASET</th>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>REPORT / FILTERS</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>ROW COUNT</th>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const filterSummary = log.filtersJson
                    ? Object.entries(log.filtersJson)
                        .filter(([, v]) => Boolean(v))
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')
                    : 'Standard criteria'

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserIcon size={14} style={{ color: '#64748b' }} />
                          <div>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>
                              {log.actor?.name || 'Workspace User'}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {log.actor?.email} ({log.actor?.role})
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: log.dataset === 'Transaction' ? '#dcfce7' : '#dbeafe',
                            color: log.dataset === 'Transaction' ? '#166534' : '#1e40af',
                          }}
                        >
                          {log.dataset}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {log.report ? (
                          <strong style={{ display: 'block', color: '#1e293b', fontSize: '12px' }}>
                            Report: {log.report.title}
                          </strong>
                        ) : null}
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{filterSummary}</span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        {log.rowCount.toLocaleString()}
                      </td>

                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <Clock size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
              No export logs recorded yet
            </strong>
            <p style={{ fontSize: '12px', margin: 0 }}>
              Completed CSV downloads will automatically log their audit parameters here.
            </p>
          </div>
        )}
      </section>
    </>
  )
}
