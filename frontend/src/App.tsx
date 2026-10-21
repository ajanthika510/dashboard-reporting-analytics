import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  api,
  clearSession,
  getSavedUser,
  getToken,
  saveSession,
  type LoginResponse,
} from './api'
import type {
  AuthUser,
  Branch,
  BreakdownItem,
  DashboardOutletContext,
  DashboardPage,
  DashboardSummary,
  DashboardWidgetsPreference,
  TrendPoint,
} from './types'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import ReportExplorerPage from './pages/ReportExplorerPage'
import SavedReportsPage from './pages/SavedReportsPage'
import DashboardSettingsPage from './pages/DashboardSettingsPage'
import DataExportsPage from './pages/DataExportsPage'
import AdminDataPreviewPage from './pages/AdminDataPreviewPage'
import DashboardLayout from './layouts/DashboardLayout'

function getPage(pathname: string): DashboardPage {
  if (pathname.startsWith('/reports/explorer')) return 'Report explorer'
  if (pathname.startsWith('/saved-reports')) return 'Saved reports'
  if (pathname.startsWith('/settings')) return 'Dashboard settings'
  if (pathname.startsWith('/exports/history') || pathname.startsWith('/data-exports')) return 'Export history'
  if (pathname.startsWith('/admin/preview')) return 'Admin data preview'
  return 'Overview'
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<AuthUser | null>(getSavedUser)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<BreakdownItem[]>([])
  const [branchBreakdown, setBranchBreakdown] = useState<BreakdownItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [preferences, setPreferences] = useState<DashboardWidgetsPreference | null>(null)

  const page = getPage(location.pathname)

  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
    setSummary(null)
    setTrends([])
    setStatusBreakdown([])
    setBranchBreakdown([])
    setBranches([])
    setSelectedBranchId('')
    setPreferences(null)
    setNotice('')
    setError('')
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    const handler = () => signOut()
    window.addEventListener('dashboard:unauthorized', handler)
    return () => window.removeEventListener('dashboard:unauthorized', handler)
  }, [signOut])

  // Load branches and preferences on user sign-in
  useEffect(() => {
    if (!user || !getToken()) return

    async function loadMeta() {
      try {
        const [branchList, prefRes] = await Promise.all([
          api<Branch[]>('/branches'),
          api<{ widgetsJson: DashboardWidgetsPreference }>('/dashboard/preferences'),
        ])
        setBranches(branchList)
        if (prefRes?.widgetsJson) {
          setPreferences(prefRes.widgetsJson)
        }
        if (user?.branchId) {
          setSelectedBranchId(user.branchId)
        }
      } catch (err) {
        console.error('Meta load failed:', err)
      }
    }

    void loadMeta()
  }, [user])

  const loadDashboardData = useCallback(async () => {
    if (!getToken()) return

    setBusy(true)
    setError('')

    const params = new URLSearchParams()
    if (startDate) params.set('from', startDate)
    if (endDate) params.set('to', endDate)
    if (selectedBranchId) params.set('branchId', selectedBranchId)
    const queryString = params.toString() ? `?${params.toString()}` : ''

    try {
      const [sum, tr, sb, bb] = await Promise.all([
        api<DashboardSummary>(`/dashboard/summary${queryString}`),
        api<TrendPoint[]>(`/dashboard/trends${queryString}`),
        api<BreakdownItem[]>(`/dashboard/breakdown?dimension=status${queryString ? `&${params.toString()}` : ''}`),
        api<BreakdownItem[]>(`/dashboard/breakdown?dimension=branch${queryString ? `&${params.toString()}` : ''}`),
      ])

      setSummary(sum)
      setTrends(tr)
      setStatusBreakdown(sb)
      setBranchBreakdown(bb)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard records.')
    } finally {
      setBusy(false)
    }
  }, [startDate, endDate, selectedBranchId])

  useEffect(() => {
    if (user && getToken() && page === 'Overview') {
      void loadDashboardData()
    }
  }, [user, loadDashboardData, page])

  const updatePreferencesHandler = async (newPrefs: DashboardWidgetsPreference) => {
    try {
      await api('/dashboard/preferences', {
        method: 'PUT',
        body: JSON.stringify({ widgetsJson: newPrefs }),
      })
      setPreferences(newPrefs)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Preferences save failed.')
    }
  }

  function login(data: LoginResponse) {
    saveSession(data)
    setUser(data.user)
    if (data.user.branchId) {
      setSelectedBranchId(data.user.branchId)
    }
    setError('')
    setNotice(`Welcome back, ${data.user.name}.`)
    navigate('/', { replace: true })
  }

  const outletContext = useMemo<DashboardOutletContext>(
    () => ({
      user: user!,
      summary,
      trends,
      statusBreakdown,
      branchBreakdown,
      branches,
      selectedBranchId,
      setSelectedBranchId,
      startDate,
      endDate,
      setStartDate,
      setEndDate,
      busy,
      error,
      notice,
      setError,
      setNotice,
      loadDashboardData,
      preferences,
      updatePreferences: updatePreferencesHandler,
    }),
    [
      user,
      summary,
      trends,
      statusBreakdown,
      branchBreakdown,
      branches,
      selectedBranchId,
      startDate,
      endDate,
      busy,
      error,
      notice,
      loadDashboardData,
      preferences,
    ],
  )

  const authenticated = Boolean(user && getToken())

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />
        }
      />

      <Route
        element={
          authenticated ? (
            <DashboardLayout
              user={user!}
              page={page}
              onNavigate={(nextPage) => {
                setError('')
                setNotice('')
                switch (nextPage) {
                  case 'Report explorer':
                    navigate('/reports/explorer')
                    break
                  case 'Saved reports':
                    navigate('/saved-reports')
                    break
                  case 'Dashboard settings':
                    navigate('/settings')
                    break
                  case 'Export history':
                    navigate('/exports/history')
                    break
                  case 'Admin data preview':
                    navigate('/admin/preview')
                    break
                  case 'Overview':
                  default:
                    navigate('/')
                    break
                }
              }}
              onSignOut={signOut}
              outletContext={outletContext}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="reports/explorer" element={<ReportExplorerPage />} />
        <Route path="saved-reports" element={<SavedReportsPage />} />
        <Route path="settings" element={<DashboardSettingsPage />} />
        <Route path="exports/history" element={<DataExportsPage />} />
        <Route path="data-exports" element={<Navigate to="/exports/history" replace />} />
        <Route path="admin/preview" element={<AdminDataPreviewPage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={authenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  )
}
