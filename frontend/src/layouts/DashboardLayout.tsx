
import { useState } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import type {
  AuthUser,
  DashboardOutletContext,
  DashboardPage,
} from '../types'

export interface DashboardLayoutProps {
  user: AuthUser
  page: DashboardPage
  onNavigate: (page: DashboardPage) => void
  onSignOut: () => void
  outletContext: DashboardOutletContext
}

export function useDashboardContext() {
  return useOutletContext<DashboardOutletContext>()
}

export default function DashboardLayout({
  user,
  page,
  onNavigate,
  onSignOut,
  outletContext,
}: DashboardLayoutProps) {
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        page={page}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        mobileNav={mobileNav}
        onCloseMobileNav={() => setMobileNav(false)}
      />

      <div className="main-area">
        <Topbar
          user={user}
          page={page}
          onOpenMobileNav={() => setMobileNav(true)}
        />

        <main className="content">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  )
}
