import { useEffect, useState } from 'react'
import {
  Clock,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { api } from '../api'
import type { AdminDataPreview } from '../types'
import { useDashboardContext } from '../layouts/DashboardLayout'

export default function AdminDataPreviewPage() {
  const { user, setError } = useDashboardContext()

  const [activeTab, setActiveTab] = useState<'branches' | 'staff' | 'tickets' | 'transactions' | 'users'>('branches')
  const [data, setData] = useState<AdminDataPreview | null>(null)
  const [busy, setBusy] = useState(false)

  const loadPreview = async (dataset = activeTab) => {
    if (user.role !== 'ADMINISTRATOR') return

    setBusy(true)
    try {
      const res = await api<AdminDataPreview>(`/admin/data-preview?dataset=${dataset}&limit=25`)
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data preview.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (user.role === 'ADMINISTRATOR') {
      void loadPreview(activeTab)
    }
  }, [activeTab, user.role])

  if (user.role !== 'ADMINISTRATOR') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
          403 — Administrator Access Required
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
          The Admin Data Preview is restricted to users with the ADMINISTRATOR role. Your current role is <strong>{user.role}</strong>.
        </p>
      </div>
    )
  }

  const overview = data?.overview

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SYSTEM GOVERNANCE</p>
          <h1>Admin Data Preview</h1>
          <p className="muted">
            Inspect live seeded operational records and audit database freshness across entities.
          </p>
        </div>

        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() => void loadPreview(activeTab)}
            disabled={busy}
          >
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            {busy ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Freshness & Count Summary */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>BRANCHES</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#1e293b' }}>
              {overview.branches}
            </div>
            <span style={{ fontSize: '11px', color: '#10b981' }}>Active &amp; Inactive</span>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>STAFF MEMBERS</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#3b82f6' }}>
              {overview.staff}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Assigned to branches</span>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SERVICE TICKETS</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#f59e0b' }}>
              {overview.tickets}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Live operational records</span>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TRANSACTIONS</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>
              {overview.transactions}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Financial records</span>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>REGISTERED USERS</span>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#8b5cf6' }}>
              {overview.users}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>4 distinct roles</span>
          </div>
        </div>
      )}

      {/* Data Freshness Notice */}
      {overview && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '22px', fontSize: '12px', color: '#1e40af' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            <span>
              <strong>Data Freshness:</strong> Latest ticket recorded at{' '}
              {overview.dataFreshness.ticketsLastUpdated
                ? new Date(overview.dataFreshness.ticketsLastUpdated).toLocaleDateString()
                : 'N/A'}{' '}
              · Latest transaction recorded at{' '}
              {overview.dataFreshness.transactionsLastUpdated
                ? new Date(overview.dataFreshness.transactionsLastUpdated).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Audit verification: OK
          </span>
        </div>
      )}

      {/* Dataset Tabs */}
      <section className="content-panel page-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { key: 'branches', label: 'Branches' },
            { key: 'staff', label: 'Staff' },
            { key: 'tickets', label: 'Service Tickets' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'users', label: 'Users & Roles' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'primary-button small-button' : 'secondary-button small-button'}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Tables */}
        {busy ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading records…</div>
        ) : !data?.records.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No records found.</div>
        ) : (
          <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              {activeTab === 'branches' && (
                <>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>NAME</th>
                      <th style={{ padding: '8px 12px' }}>CODE</th>
                      <th style={{ padding: '8px 12px' }}>LOCATION</th>
                      <th style={{ padding: '8px 12px' }}>STATUS</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>STAFF</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>TICKETS</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>TRANSACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.name}</td>
                        <td style={{ padding: '8px 12px' }}><code>{b.code}</code></td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{b.location || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: b.isActive ? '#dcfce7' : '#fee2e2', color: b.isActive ? '#15803d' : '#991b1b', fontWeight: 700 }}>
                            {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{b._count?.staff ?? 0}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{b._count?.serviceTickets ?? 0}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{b._count?.transactions ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'staff' && (
                <>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>NAME</th>
                      <th style={{ padding: '8px 12px' }}>EMAIL</th>
                      <th style={{ padding: '8px 12px' }}>ASSIGNED BRANCH</th>
                      <th style={{ padding: '8px 12px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{s.email || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{s.branch?.name} ({s.branch?.code})</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: s.isActive ? '#dcfce7' : '#fee2e2', color: s.isActive ? '#15803d' : '#991b1b', fontWeight: 700 }}>
                            {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'tickets' && (
                <>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>REFERENCE</th>
                      <th style={{ padding: '8px 12px' }}>TITLE / CATEGORY</th>
                      <th style={{ padding: '8px 12px' }}>BRANCH</th>
                      <th style={{ padding: '8px 12px' }}>STATUS</th>
                      <th style={{ padding: '8px 12px' }}>PRIORITY</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>AMOUNT (LKR)</th>
                      <th style={{ padding: '8px 12px' }}>OPENED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}><code>{t.reference}</code></td>
                        <td style={{ padding: '8px 12px' }}>
                          <div>{t.title || t.category}</div>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{t.category}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>{t.branch?.name}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 700 }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>{t.priority}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                          Rs {Number(t.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {new Date(t.openedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'transactions' && (
                <>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>REFERENCE</th>
                      <th style={{ padding: '8px 12px' }}>CATEGORY</th>
                      <th style={{ padding: '8px 12px' }}>BRANCH</th>
                      <th style={{ padding: '8px 12px' }}>STATUS</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>AMOUNT</th>
                      <th style={{ padding: '8px 12px' }}>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}><code>{tx.reference}</code></td>
                        <td style={{ padding: '8px 12px' }}>{tx.category}</td>
                        <td style={{ padding: '8px 12px' }}>{tx.branch?.name}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: tx.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7', color: tx.status === 'COMPLETED' ? '#15803d' : '#92400e', fontWeight: 700 }}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                          Rs {Number(tx.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {new Date(tx.transactionDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'users' && (
                <>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>NAME</th>
                      <th style={{ padding: '8px 12px' }}>EMAIL</th>
                      <th style={{ padding: '8px 12px' }}>ROLE</th>
                      <th style={{ padding: '8px 12px' }}>SCOPED BRANCH</th>
                      <th style={{ padding: '8px 12px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '8px 12px' }}>{u.email}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontWeight: 700 }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {u.branch?.name || 'All Branches (Unrestricted)'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#15803d' : '#991b1b', fontWeight: 700 }}>
                            {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </section>
    </>
  )
}
