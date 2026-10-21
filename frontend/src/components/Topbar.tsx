import { Menu } from 'lucide-react'
import type { AuthUser, DashboardPage } from '../types'

interface TopbarProps {
  user: AuthUser
  page: DashboardPage
  onOpenMobileNav: () => void
}

export default function Topbar({
  user,
  page,
  onOpenMobileNav,
}: TopbarProps) {
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const roleLabel = user.role
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-button mobile-menu-button"
          aria-label="Open navigation"
          onClick={onOpenMobileNav}
        >
          <Menu size={21} strokeWidth={2} />
        </button>

        <div className="topbar-heading">
          <span className="topbar-breadcrumb">
            Workspace <span aria-hidden="true">/</span>
          </span>
          <h2>{page}</h2>
        </div>
      </div>

      <div className="topbar-right">
        <div
          className="live-indicator"
          role="status"
          aria-label="Dashboard data status"
        >
          <span className="live-indicator-dot" aria-hidden="true" />
          <span className="live-indicator-label">Live data</span>
        </div>

        <div className="topbar-user">
          <div className="profile-avatar" aria-hidden="true">
            {initials || 'U'}
          </div>

          <div className="topbar-user-details">
            <strong>{user.name}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
