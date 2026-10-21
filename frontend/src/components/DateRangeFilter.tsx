import { Building2, CalendarDays, RotateCcw } from 'lucide-react'
import type { Branch } from '../types'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  busy: boolean
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void
  branches?: Branch[]
  selectedBranchId?: string
  setSelectedBranchId?: (val: string) => void
  onApply: () => void
}

export default function DateRangeFilter({
  startDate,
  endDate,
  busy,
  setStartDate,
  setEndDate,
  branches = [],
  selectedBranchId = '',
  setSelectedBranchId,
  onApply,
}: DateRangeFilterProps) {
  return (
    <section className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
      <div className="filter-title">
        <CalendarDays size={17} />
        <span>Date &amp; Branch Filters</span>
      </div>

      <label>
        From:
        <input
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </label>

      <label>
        To:
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </label>

      {branches.length > 0 && setSelectedBranchId && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={16} style={{ color: '#64748b' }} />
          Branch:
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            style={{
              height: '31px',
              border: '1px solid #e3e9f2',
              borderRadius: '6px',
              padding: '0 8px',
              color: '#3b4a60',
              background: '#fff',
              fontSize: '11px',
            }}
          >
            {branches.length > 1 && <option value="">All Permitted Branches</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        className="text-button"
        onClick={() => {
          setStartDate('')
          setEndDate('')
          if (setSelectedBranchId && branches.length > 1) {
            setSelectedBranchId('')
          }
        }}
      >
        <RotateCcw size={13} style={{ marginRight: 4 }} />
        Reset
      </button>

      <button
        type="button"
        className="apply-button"
        onClick={onApply}
        disabled={busy}
      >
        {busy ? 'Updating…' : 'Apply filters'}
      </button>
    </section>
  )
}
