import {
  ArrowDownToLine,
  Database,
  FileBarChart,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Settings,
  X,
} from 'lucide-react'
import type { AuthUser, DashboardPage } from '../types'

interface SidebarProps {
  user: AuthUser
  page: DashboardPage
  onNavigate: (page: DashboardPage) => void
  onSignOut: () => void
  mobileNav: boolean
  onCloseMobileNav: () => void
}

export default function Sidebar({
  user,
  page,
  onNavigate,
  onSignOut,
  mobileNav,
  onCloseMobileNav,
}: SidebarProps) {
  const navItems: { label: DashboardPage; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Report explorer', icon: FileSpreadsheet },
    { label: 'Saved reports', icon: FileBarChart },
    { label: 'Dashboard settings', icon: Settings },
    { label: 'Export history', icon: ArrowDownToLine },
    ...(user.role === 'ADMINISTRATOR'
      ? [{ label: 'Admin data preview' as DashboardPage, icon: Database, adminOnly: true }]
      : []),
  ]

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
      case 'MANAGER':
        return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
      case 'ANALYST':
        return { background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
    }
  }

  return (
    <>
      {mobileNav && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={onCloseMobileNav}
        />
      )}

      <aside className={`sidebar${mobileNav ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <LayoutDashboard size={23} />
          </div>

          <div className="brand-copy">
            <strong>NEIRAH</strong>
            <span>REPORTING &amp; ANALYTICS</span>
          </div>

          <button
            type="button"
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={onCloseMobileNav}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-section-label">NAVIGATION</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, adminOnly }) => (
            <button
              key={label}
              type="button"
              className={`nav-item${page === label ? ' active' : ''}`}
              aria-current={page === label ? 'page' : undefined}
              onClick={() => {
                onNavigate(label)
                onCloseMobileNav()
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {adminOnly && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: '#fef2f2',
                    color: '#b91c1c',
                  }}
                >
                  ADMIN
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {user.name.trim().charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>{user.name}</strong>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginTop: '3px',
                  width: 'fit-content',
                  ...getRoleBadgeStyle(user.role),
                }}
              >
                {user.role}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="nav-item sign-out-button"
            onClick={onSignOut}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
