import { useState, type FormEvent } from 'react'
import { Activity, ArrowRight, BarChart3, ShieldCheck } from 'lucide-react'
import { api } from '../api'
import type { LoginResponse } from '../types'

interface LoginPageProps {
  onLogin: (data: LoginResponse) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const result = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })

      onLogin(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-decoration decoration-one" aria-hidden="true" />
      <div className="login-decoration decoration-two" aria-hidden="true" />

      <section className="login-panel">
        <a className="login-brand" href="/login" aria-label="Neirah Tech login">
          <span className="brand-mark">
            <BarChart3 size={24} strokeWidth={2.2} />
          </span>
          <span className="login-brand-copy">
            <strong>NEIRAH</strong>
            <span>TECH SOLUTION</span>
          </span>
        </a>

        <div className="login-intro">
          <p className="eyebrow">REPORTING WORKSPACE</p>
          <h1>Clarity behind every number.</h1>
          <p className="muted login-copy">
            Sign in to explore performance, understand trends, and make
            data-informed decisions.
          </p>
        </div>

        <form onSubmit={submit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              disabled={busy}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              disabled={busy}
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button full-button login-submit"
            disabled={busy}
          >
            <span>{busy ? 'Signing in...' : 'Sign in to workspace'}</span>
            {!busy && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>DEMO ACCOUNTS (CLICK TO AUTOFILL):</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '11px', padding: '4px 8px', height: '28px' }}
              onClick={() => {
                setEmail('admin@neirahtech.com');
                setPassword('admin12345678');
              }}
            >
              Admin
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '11px', padding: '4px 8px', height: '28px' }}
              onClick={() => {
                setEmail('manager.colombo@neirahtech.com');
                setPassword('manager12345678');
              }}
            >
              Manager (Colombo)
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '11px', padding: '4px 8px', height: '28px' }}
              onClick={() => {
                setEmail('manager.global@neirahtech.com');
                setPassword('manager12345678');
              }}
            >
              Manager (Global)
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '11px', padding: '4px 8px', height: '28px' }}
              onClick={() => {
                setEmail('analyst@neirahtech.com');
                setPassword('analyst12345678');
              }}
            >
              Analyst
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '11px', padding: '4px 8px', height: '28px' }}
              onClick={() => {
                setEmail('viewer@neirahtech.com');
                setPassword('viewer12345678');
              }}
            >
              Viewer
            </button>
          </div>
        </div>

        <div className="login-foot">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Secure access</span>
          <span className="login-foot-separator" aria-hidden="true">·</span>
          <span>Role-based permissions</span>
        </div>
      </section>

      <aside className="login-side">
        <div className="login-side-content">
          <span className="side-kicker">
            <span className="side-kicker-dot" />
            YOUR BUSINESS, IN FOCUS
          </span>

          <h2>
            Turn operational data into <span>better decisions.</span>
          </h2>

          <p>
            Monitor performance, uncover meaningful trends, and keep your team
            aligned through one clear reporting workspace.
          </p>

          <div className="login-feature">
            <span className="login-feature-icon">
              <Activity size={20} />
            </span>
            <div>
              <strong>Insights that move you forward</strong>
              <span>Reports, analytics, and secure data exports.</span>
            </div>
          </div>
        </div>

        <div className="side-bottom">
          <span>NEIRAH TECH SOLUTION</span>
          <span>Reporting &amp; Analytics Management System</span>
        </div>
      </aside>
    </main>
  )
}