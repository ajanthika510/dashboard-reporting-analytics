import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  Edit2,
  ExternalLink,
  FileBarChart,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api, downloadCsv } from '../api'
import type { SavedReport } from '../types'
import { useDashboardContext } from '../layouts/DashboardLayout'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function SavedReportsPage() {
  const { user, setError, setNotice } = useDashboardContext()
  const navigate = useNavigate()

  const [reports, setReports] = useState<SavedReport[]>([])
  const [busy, setBusy] = useState(false)

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<SavedReport | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editVisibility, setEditVisibility] = useState<'PRIVATE' | 'SHARED'>('PRIVATE')
  const [savingEdit, setSavingEdit] = useState(false)

  const loadReports = async () => {
    setBusy(true)
    try {
      const data = await api<SavedReport[]>('/reports/saved')
      setReports(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved reports.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const handleDelete = async (report: SavedReport) => {
    if (!window.confirm(`Are you sure you want to delete "${report.title}"?`)) return

    try {
      await api(`/reports/saved/${report.id}`, { method: 'DELETE' })
      setNotice(`Report "${report.title}" deleted.`)
      setReports((prev) => prev.filter((r) => r.id !== report.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report.')
    }
  }

  const handleExport = async (report: SavedReport) => {
    try {
      const count = await downloadCsv(
        '/reports/export',
        `${report.title.toLowerCase().replace(/\s+/g, '-')}.csv`,
        {
          method: 'POST',
          body: JSON.stringify({ reportId: report.id }),
        },
      )
      setNotice(`Report "${report.title}" exported · ${count ?? 0} rows.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.')
    }
  }

  const openEditModal = (report: SavedReport) => {
    setEditingReport(report)
    setEditTitle(report.title)
    setEditVisibility(report.visibility)
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReport || !editTitle.trim()) return

    setSavingEdit(true)
    try {
      const updated = await api<SavedReport>(`/reports/saved/${editingReport.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle.trim(),
          visibility: editVisibility,
        }),
      })

      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, title: updated.title, visibility: updated.visibility } : r)),
      )
      setNotice(`Report updated to "${updated.title}".`)
      setEditModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">REPORTING WORKSPACE</p>
          <h1>Saved Reports</h1>
          <p className="muted">
            Explore reusable report definitions, execute saved queries, and manage visibility.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() => void loadReports()}
            disabled={busy}
          >
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            Refresh
          </button>
          {user.role !== 'VIEWER' && (
            <button
              className="primary-button"
              onClick={() => navigate('/reports/explorer')}
            >
              <Plus size={16} /> New report
            </button>
          )}
        </div>
      </div>

      <section className="content-panel page-panel" style={{ padding: '20px' }}>
        <div className="panel-heading" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Available Report Configurations</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Your private definitions and organization-wide shared reports
            </p>
          </div>
        </div>

        {busy && !reports.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading saved reports…
          </div>
        ) : reports.length ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {reports.map((report) => {
              const canModify = report.ownerId === user.id || user.role === 'ADMINISTRATOR'
              const config = report.configJson || {}

              return (
                <article
                  key={report.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        color: '#3b82f6',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileBarChart size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>{report.title}</strong>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: report.visibility === 'SHARED' ? '#dcfce7' : '#f1f5f9',
                            color: report.visibility === 'SHARED' ? '#15803d' : '#475569',
                          }}
                        >
                          {report.visibility}
                        </span>
                      </div>

                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Dataset: <strong>{report.dataset}</strong> · Group by: <strong>{config.dimension || 'branch'}</strong> · Metric: <strong>{config.metric || 'count'}</strong>
                      </p>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        <span>Owner: {report.owner?.name || 'Workspace User'}</span>
                        <span>Updated: {formatDate(report.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="secondary-button small-button"
                      onClick={() => navigate('/reports/explorer')}
                      title="Open in Report Explorer"
                    >
                      <ExternalLink size={13} /> Open
                    </button>

                    {user.role !== 'VIEWER' && (
                      <button
                        type="button"
                        className="secondary-button small-button"
                        onClick={() => void handleExport(report)}
                        title="Download CSV"
                      >
                        <ArrowDownToLine size={13} /> Export
                      </button>
                    )}

                    {canModify && (
                      <button
                        type="button"
                        className="secondary-button small-button"
                        onClick={() => openEditModal(report)}
                        title="Edit Report"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    )}

                    {canModify && (
                      <button
                        type="button"
                        className="secondary-button small-button"
                        style={{ color: '#ef4444' }}
                        onClick={() => void handleDelete(report)}
                        title="Delete Report"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <FileBarChart size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <strong style={{ display: 'block', fontSize: '15px', color: '#1e293b', marginBottom: '6px' }}>
              No saved reports yet
            </strong>
            <p style={{ fontSize: '13px', margin: '0 0 16px' }}>
              Create and save your custom reports in the Report Explorer.
            </p>
            {user.role !== 'VIEWER' && (
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate('/reports/explorer')}
              >
                Go to Report Explorer
              </button>
            )}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      {editModalOpen && (
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
              width: 'min(90vw, 440px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Edit Report Configuration</h2>
            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 10px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Visibility
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as any)}
                  style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 10px', fontSize: '13px' }}
                >
                  <option value="PRIVATE">Private (Only you can see)</option>
                  <option value="SHARED">Shared (Visible to team members)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingEdit || !editTitle.trim()}
                >
                  {savingEdit ? 'Updating…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
