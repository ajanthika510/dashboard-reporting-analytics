import type { AuthUser, LoginResponse } from './types'

export type { AuthUser, LoginResponse }

const API_BASE = '/api'

export function getToken(): string | null {
  return sessionStorage.getItem('dashboard_token')
}

export function clearSession(): void {
  sessionStorage.removeItem('dashboard_token')
  sessionStorage.removeItem('dashboard_user')
}

export function saveSession(data: LoginResponse): void {
  sessionStorage.setItem('dashboard_token', data.accessToken)
  sessionStorage.setItem('dashboard_user', JSON.stringify(data.user))
}

export function getSavedUser(): AuthUser | null {
  const value = sessionStorage.getItem('dashboard_user')
  if (!value) return null

  try {
    return JSON.parse(value) as AuthUser
  } catch {
    clearSession()
    return null
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)

  if (token) headers.set('Authorization', `Bearer ${token}`)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearSession()
    window.dispatchEvent(new Event('dashboard:unauthorized'))
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload
        ? String(payload.message)
        : `Request failed (${response.status})`

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function downloadCsv(
  path: string,
  fallbackName: string,
  options: RequestInit = {},
): Promise<number | null> {
  const token = getToken()
  if (!token) throw new Error('Please sign in again.')

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearSession()
    window.dispatchEvent(new Event('dashboard:unauthorized'))
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload
        ? String(payload.message)
        : `Export failed (${response.status})`
    throw new Error(message)
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition')
  const match = disposition?.match(/filename="?([^";]+)"?/i)
  const filename = match?.[1] ?? fallbackName
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)

  const rowCount = response.headers.get('X-Export-Row-Count')
  return rowCount === null ? null : Number(rowCount)
}
