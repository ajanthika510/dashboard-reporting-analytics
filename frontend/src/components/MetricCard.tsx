import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  note: string
  icon: ReactNode
  accent?: 'blue' | 'green' | 'violet' | 'amber'
}

export default function MetricCard({
  label,
  value,
  note,
  icon,
  accent = 'blue',
}: MetricCardProps) {
  return (
    <article className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${accent}`}>{icon}</span>
      </div>
      <strong>{value}</strong>
      <div className="metric-foot">
        <span className="metric-note">{note}</span>
      </div>
    </article>
  )
}
