import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  RotateCcw,
  Save,
  Settings,
  Square,
} from 'lucide-react'
import { useDashboardContext } from '../layouts/DashboardLayout'
import type { DashboardWidgetsPreference } from '../types'

const ALL_CARDS: { id: string; label: string; desc: string }[] = [
  { id: 'totalTickets', label: 'Total Tickets', desc: 'Count of all tickets in selected date and branch scope' },
  { id: 'openTickets', label: 'Open Tickets', desc: 'Workload requiring action: New, Assigned, In Progress' },
  { id: 'resolvedTickets', label: 'Resolved Tickets', desc: 'Completed workload: Resolved or Closed' },
  { id: 'avgResolutionTime', label: 'Average Resolution Time', desc: 'Average duration between ticket open and close timestamps' },
  { id: 'transactionTotal', label: 'Transaction Revenue', desc: 'Sum of completed transaction amounts in LKR' },
  { id: 'transactionCount', label: 'Completed Transactions', desc: 'Number of successfully executed transactions' },
]

const ALL_CHARTS: { id: string; label: string; desc: string }[] = [
  { id: 'ticketStatusBreakdown', label: 'Ticket Status Breakdown', desc: 'Donut chart illustrating workload distribution across statuses' },
  { id: 'monthlyTrend', label: 'Monthly Volume Trend', desc: 'Timeline line chart comparing ticket vs transaction volumes' },
  { id: 'branchTransactions', label: 'Transaction Totals by Branch', desc: 'Bar chart comparing completed revenues across active branches' },
]

export default function DashboardSettingsPage() {
  const { preferences, updatePreferences, setNotice, setError } = useDashboardContext()

  const [visibleCards, setVisibleCards] = useState<string[]>(
    preferences?.visibleCards ?? ALL_CARDS.map((c) => c.id),
  )

  const [visibleCharts, setVisibleCharts] = useState<string[]>(
    preferences?.visibleCharts ?? ALL_CHARTS.map((c) => c.id),
  )

  const [cardOrder, setCardOrder] = useState<string[]>(
    preferences?.cardOrder ?? ALL_CARDS.map((c) => c.id),
  )

  const [saving, setSaving] = useState(false)

  const toggleCard = (id: string) => {
    if (visibleCards.includes(id)) {
      if (visibleCards.length <= 1) {
        setError('At least one KPI card must remain visible.')
        return
      }
      setVisibleCards(visibleCards.filter((c) => c !== id))
    } else {
      setVisibleCards([...visibleCards, id])
    }
  }

  const toggleChart = (id: string) => {
    if (visibleCharts.includes(id)) {
      if (visibleCharts.length <= 1) {
        setError('At least one chart must remain visible.')
        return
      }
      setVisibleCharts(visibleCharts.filter((c) => c !== id))
    } else {
      setVisibleCharts([...visibleCharts, id])
    }
  }

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...cardOrder]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newOrder.length) return

    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp
    setCardOrder(newOrder)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: DashboardWidgetsPreference = {
        version: 1,
        visibleCards,
        visibleCharts,
        cardOrder,
      }
      await updatePreferences(payload)
      setNotice('Dashboard widget preferences saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setVisibleCards(ALL_CARDS.map((c) => c.id))
    setVisibleCharts(ALL_CHARTS.map((c) => c.id))
    setCardOrder(ALL_CARDS.map((c) => c.id))
    setNotice('Reset to default layout. Click "Save Preferences" to persist.')
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMIZATION</p>
          <h1>Dashboard Settings</h1>
          <p className="muted">
            Customize widget visibility and reorder performance cards for your signed-in workspace.
          </p>
        </div>

        <div className="heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw size={15} /> Reset Default
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* KPI Cards Ordering & Visibility */}
        <section className="content-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Settings size={18} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>KPI Performance Cards</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            Check cards to display on your Overview and use the arrows to reorder them.
          </p>

          <div style={{ display: 'grid', gap: '10px' }}>
            {cardOrder.map((cardId, index) => {
              const cardDef = ALL_CARDS.find((c) => c.id === cardId)
              if (!cardDef) return null
              const isVisible = visibleCards.includes(cardId)

              return (
                <div
                  key={cardId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: isVisible ? '#fff' : '#f8fafc',
                    opacity: isVisible ? 1 : 0.6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCard(cardId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    {isVisible ? (
                      <CheckSquare size={19} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    ) : (
                      <Square size={19} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    )}
                    <div>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{cardDef.label}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                        {cardDef.desc}
                      </p>
                    </div>
                  </button>

                  <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => moveCard(index, 'up')}
                      disabled={index === 0}
                      title="Move Up"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => moveCard(index, 'down')}
                      disabled={index === cardOrder.length - 1}
                      title="Move Down"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Charts Visibility */}
        <section className="content-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Settings size={18} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Dashboard Visualizations</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            Choose which graphical breakdowns to show on your dashboard.
          </p>

          <div style={{ display: 'grid', gap: '10px' }}>
            {ALL_CHARTS.map((chart) => {
              const isVisible = visibleCharts.includes(chart.id)

              return (
                <div
                  key={chart.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: isVisible ? '#fff' : '#f8fafc',
                    opacity: isVisible ? 1 : 0.6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleChart(chart.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    {isVisible ? (
                      <CheckSquare size={19} style={{ color: '#10b981', flexShrink: 0 }} />
                    ) : (
                      <Square size={19} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    )}
                    <div>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{chart.label}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                        {chart.desc}
                      </p>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
