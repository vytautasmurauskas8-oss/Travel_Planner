import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import { checkSupabaseConnection, supabase, supabaseConfigError } from './lib/supabase'
import './App.css'

function CompassMark() {
  return <span className="brand-mark" aria-hidden="true">✳</span>
}

function Navigation() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLogoutError('Could not sign out. Please try again.')
      console.error('Supabase sign out failed:', error)
      return
    }
    navigate('/login', { replace: true })
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Travel Planner home"><CompassMark /><span>travel<span className="brand-light">planner</span></span></Link>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="/" end>My trips</NavLink>
        <NavLink to="/trips/new" className="nav-create">+ <span>New trip</span></NavLink>
      </nav>
      <div className="account-nav">
        {!loading && (user
          ? <><span className="user-email">{user.email}</span><button className="nav-button" type="button" onClick={handleLogout}>Log out</button></>
          : <><NavLink to="/login">Sign in</NavLink><NavLink className="button button-small" to="/register">Sign up</NavLink></>)}
      </div>
      {logoutError && <p className="nav-error" role="alert">{logoutError}</p>}
    </header>
  )
}

function PageShell({ children }) {
  return <><Navigation /><main className="page-content">{children}</main><footer className="site-footer"><span><CompassMark /> Make room for the good parts.</span><span>Thoughtfully planned, freely explored.</span></footer></>
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <main className="auth-loading" role="status">Loading your session…</main>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <main className="auth-loading" role="status">Loading your session…</main>
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />
  return children
}

function Dashboard() {
  return (
    <PageShell>
      <section className="welcome-row">
        <div><p className="eyebrow">YOUR NEXT CHAPTER</p><h1>Every great trip<br className="desktop-break" /> starts somewhere.</h1><p className="intro">A little planning goes a long way. Your adventures will live here.</p></div>
        <div className="welcome-stamp" aria-hidden="true"><span>✳</span><small>GO<br />SOMEWHERE</small></div>
      </section>
      <section className="trips-section" aria-labelledby="trips-heading">
        <div className="section-heading"><div><h2 id="trips-heading">Your trips</h2><p>The plans, the places, the possibilities.</p></div><Link className="text-link" to="/trips/new">+ Plan a trip</Link></div>
        <div className="empty-state"><div className="empty-art" aria-hidden="true"><span className="sun">☼</span><span className="art-line line-one"/><span className="art-line line-two"/><span className="art-line line-three"/><span className="art-plane">✈</span></div><p className="eyebrow">THE MAP IS YOURS</p><h3>A fresh page. A thousand possibilities.</h3><p className="empty-copy">No trips just yet. Pick a place you’ve been dreaming about<br className="desktop-break" /> and let’s start putting it together.</p><Link className="button" to="/trips/new">Create your first trip <span aria-hidden="true">→</span></Link></div>
      </section>
    </PageShell>
  )
}

function NewTrip() {
  return <PageShell><div className="form-page"><Link className="back-link" to="/">← Back to your trips</Link><p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p><h1>Plan a new trip</h1><p className="intro">Start with the basics. The details can come later.</p><form className="form-card" onSubmit={(event) => event.preventDefault()}><label>Where are you headed?<input type="text" placeholder="e.g. Kyoto, Japan" /></label><div className="form-grid"><label>Departure<input type="date" /></label><label>Return<input type="date" /></label></div><label>Trip name <span className="optional">(optional)</span><input type="text" placeholder="A week among the temples" /></label><p className="demo-note">Trip planning will be available in a future update.</p><button className="button" type="submit">Start planning <span aria-hidden="true">→</span></button></form></div></PageShell>
}

function TripDetails() {
  const { id } = useParams()
  return <PageShell><div className="form-page details-page"><Link className="back-link" to="/">← Back to your trips</Link><div className="not-found-mark" aria-hidden="true">✳</div><p className="eyebrow">TRIP DETAILS</p><h1>Your next adventure</h1><p className="intro">Trip <code>{id}</code> is ready for its plans. Trip details will appear here when trips are available.</p><Link className="button" to="/trips/new">Plan a new trip <span aria-hidden="true">→</span></Link></div></PageShell>
}

function AuthPage({ register = false }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const normalizedEmail = email.trim()
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Your password must be at least 8 characters long.')
      return
    }
    if (register && password !== passwordConfirmation) {
      setErrorMessage('The passwords do not match.')
      return
    }
    if (!supabase) {
      setErrorMessage(supabaseConfigError)
      return
    }

    setLoading(true)
    try {
      if (register) {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password })
        if (error) throw error
        if (data.session) {
          navigate(location.state?.from?.pathname ?? '/', { replace: true })
        } else {
          setSuccessMessage('Account created. Check your email for a confirmation link before signing in.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        if (error) throw error
        navigate(location.state?.from?.pathname ?? '/', { replace: true })
      }
    } catch (error) {
      console.error(`Supabase ${register ? 'sign up' : 'sign in'} failed:`, error)
      setErrorMessage(getAuthErrorMessage(error, register))
    } finally {
      setLoading(false)
    }
  }

  const title = register ? 'Make it official.' : 'Good to have you back.'
  return <PageShell><div className="form-page auth-page"><div className="auth-mark"><CompassMark /></div><p className="eyebrow">{register ? 'YOUR NEXT CHAPTER' : 'PICK UP WHERE YOU LEFT OFF'}</p><h1>{title}</h1><p className="intro">{register ? 'Create an account to keep your travel ideas together.' : 'Sign in to find your trips and travel plans.'}</p>
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <label>Password<input type="password" autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required minLength={8} /></label>
      {register && <label>Confirm password<input type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Enter your password again" required minLength={8} /></label>}
      {errorMessage && <p className="form-message form-error" role="alert">{errorMessage}</p>}
      {successMessage && <p className="form-message form-success" role="status">{successMessage}</p>}
      <button className="button button-full" type="submit" disabled={loading}>{loading ? (register ? 'Creating account…' : 'Signing in…') : (register ? 'Create Account' : 'Sign In')}</button>
    </form>
    <p className="auth-switch">{register ? 'Already have an account?' : 'New around here?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
  </div></PageShell>
}

function getAuthErrorMessage(error, register) {
  const message = error?.message?.toLowerCase() ?? ''
  if (message.includes('invalid login credentials')) return 'Email or password is incorrect. Check your details and try again.'
  if (message.includes('already registered') || message.includes('user already registered')) return 'An account with this email already exists. Try signing in instead.'
  if (message.includes('password')) return register ? 'The password does not meet the authentication requirements.' : 'Email or password is incorrect. Check your details and try again.'
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Too many attempts. Wait a little and try again.'
  if (message.includes('network') || message.includes('fetch')) return 'Could not reach the authentication service. Check your connection and try again.'
  return register ? 'We could not create your account. Check your details and try again.' : 'We could not sign you in. Check your details and try again.'
}

function NotFound() {
  return <PageShell><div className="form-page not-found-page"><div className="not-found-mark" aria-hidden="true">404</div><p className="eyebrow">OFF THE MAP</p><h1>Looks like a wrong turn.</h1><p className="intro">We can’t find the page you’re looking for. Let’s get you back on track.</p><Link className="button" to="/">Back to your trips <span aria-hidden="true">→</span></Link></div></PageShell>
}

function SupabaseCheck() {
  const [result, setResult] = useState(null)
  useEffect(() => {
    let isCurrent = true
    checkSupabaseConnection().then((connectionResult) => { if (isCurrent) setResult(connectionResult) })
    return () => { isCurrent = false }
  }, [])
  return <main><h1>Supabase connection check</h1><p role="status" aria-live="polite">{result ? `${result.status}: ${result.message ?? result.error}` : 'Checking Supabase…'}</p><p>This check never displays configuration values. A successful query does not prove authenticated RLS access.</p></main>
}

function App() {
  return <Routes>
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/trips/new" element={<ProtectedRoute><NewTrip /></ProtectedRoute>} />
    <Route path="/trips/:id" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
    <Route path="/login" element={<AuthRoute><AuthPage /></AuthRoute>} />
    <Route path="/register" element={<AuthRoute><AuthPage register /></AuthRoute>} />
    <Route path="/supabase-check" element={<SupabaseCheck />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}

export default App
