import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import { checkSupabaseConnection, supabase, supabaseConfigError } from './lib/supabase'
import { EditTrip, TripDetails } from './pages/TripManagement'
import PageShell from './components/PageShell'
import './App.css'

function CompassMark() {
  return <span className="brand-mark" aria-hidden="true">✳</span>
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
  const { user } = useAuth()
  const [tripState, setTripState] = useState({ ownerId: null, status: 'loading', trips: [], message: '' })
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadTrips() {
      setTripState({ ownerId: user.id, status: 'loading', trips: [], message: '' })
      if (!supabase) {
        setTripState({ ownerId: user.id, status: 'error', trips: [], message: supabaseConfigError })
        return
      }

      const { data, error } = await supabase
        .from('trips')
        .select('id, title, country, city, start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true })

      if (!isCurrent) return
      if (error) {
        console.error('Could not load trips:', error)
        setTripState({ ownerId: user.id, status: 'error', trips: [], message: 'We could not load your trips. Check your connection and try again.' })
        return
      }

      setTripState({ ownerId: user.id, status: 'success', trips: data ?? [], message: '' })
    }

    loadTrips().catch((error) => {
      if (!isCurrent) return
      console.error('Could not load trips:', error)
      setTripState({ ownerId: user.id, status: 'error', trips: [], message: 'We could not load your trips. Check your connection and try again.' })
    })

    return () => { isCurrent = false }
  }, [user.id, retryCount])

  const currentTripState = tripState.ownerId === user.id ? tripState : { status: 'loading', trips: [], message: '' }

  return (
    <PageShell>
      <section className="welcome-row">
        <div><p className="eyebrow">YOUR NEXT CHAPTER</p><h1>Every great trip<br className="desktop-break" /> starts somewhere.</h1><p className="intro">A little planning goes a long way. Your adventures will live here.</p></div>
        <div className="welcome-stamp" aria-hidden="true"><span>✳</span><small>GO<br />SOMEWHERE</small></div>
      </section>
      <section className="trips-section" aria-labelledby="trips-heading">
        <div className="section-heading"><div><h2 id="trips-heading">Your trips</h2><p>The plans, the places, the possibilities.</p></div><Link className="text-link" to="/trips/new">+ Plan a trip</Link></div>
        {currentTripState.status === 'loading' && <div className="trips-feedback" role="status" aria-live="polite">Loading your trips…</div>}
        {currentTripState.status === 'error' && <div className="trips-feedback trips-error" role="alert"><p>{currentTripState.message}</p><button className="text-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div>}
        {currentTripState.status === 'success' && currentTripState.trips.length === 0 && <div className="empty-state"><div className="empty-art" aria-hidden="true"><span className="sun">☼</span><span className="art-line line-one"/><span className="art-line line-two"/><span className="art-line line-three"/><span className="art-plane">✈</span></div><p className="eyebrow">THE MAP IS YOURS</p><h3>A fresh page. A thousand possibilities.</h3><p className="empty-copy">No trips just yet. Pick a place you’ve been dreaming about<br className="desktop-break" /> and let’s start putting it together.</p><Link className="button" to="/trips/new">Create your first trip <span aria-hidden="true">→</span></Link></div>}
        {currentTripState.status === 'success' && currentTripState.trips.length > 0 && <div className="trip-grid">{currentTripState.trips.map((trip) => <Link className="trip-card" key={trip.id} to={`/trips/${trip.id}`}><span className="eyebrow">{trip.city}, {trip.country}</span><h3>{trip.title}</h3><p>{formatTripDates(trip.start_date, trip.end_date)}</p><span className="trip-card-link">View trip <span aria-hidden="true">→</span></span></Link>)}</div>}
      </section>
    </PageShell>
  )
}

function formatTripDates(startDate, endDate) {
  const formatDate = (date) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

function NewTrip() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', city: '', country: '', startDate: '', endDate: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setErrorMessage('')
  }

  function validateForm() {
    const errors = {}
    if (!form.title.trim()) errors.title = 'Enter a trip name.'
    if (!form.city.trim()) errors.city = 'Enter a city or destination.'
    if (!form.country.trim()) errors.country = 'Enter a country.'
    if (!form.startDate) errors.startDate = 'Choose a departure date.'
    if (!form.endDate) errors.endDate = 'Choose a return date.'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errors.endDate = 'The return date cannot be before the departure date.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!user) {
      navigate('/login', { replace: true, state: { from: { pathname: '/trips/new' } } })
      return
    }
    if (!validateForm()) return
    if (!supabase) {
      setErrorMessage(supabaseConfigError)
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        title: form.title.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        start_date: form.startDate,
        end_date: form.endDate,
        description: form.description.trim() || null,
      })
      if (error) throw error
      navigate('/', { replace: true, state: { tripCreated: true } })
    } catch (error) {
      console.error('Could not create trip:', error)
      setErrorMessage(getTripCreationErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return <PageShell><div className="form-page"><Link className="back-link" to="/">← Back to your trips</Link><p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p><h1>Plan a new trip</h1><p className="intro">Start with the basics. The details can come later.</p>
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <label>Trip name<input name="title" type="text" value={form.title} onChange={updateField} placeholder="A week among the temples" required aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'trip-title-error' : undefined} />{fieldErrors.title && <span className="field-error" id="trip-title-error">{fieldErrors.title}</span>}</label>
      <div className="form-grid"><label>City<input name="city" type="text" value={form.city} onChange={updateField} placeholder="Kyoto" required aria-invalid={Boolean(fieldErrors.city)} aria-describedby={fieldErrors.city ? 'trip-city-error' : undefined} />{fieldErrors.city && <span className="field-error" id="trip-city-error">{fieldErrors.city}</span>}</label><label>Country<input name="country" type="text" value={form.country} onChange={updateField} placeholder="Japan" required aria-invalid={Boolean(fieldErrors.country)} aria-describedby={fieldErrors.country ? 'trip-country-error' : undefined} />{fieldErrors.country && <span className="field-error" id="trip-country-error">{fieldErrors.country}</span>}</label></div>
      <div className="form-grid"><label>Departure<input name="startDate" type="date" value={form.startDate} onChange={updateField} required aria-invalid={Boolean(fieldErrors.startDate)} aria-describedby={fieldErrors.startDate ? 'trip-start-error' : undefined} />{fieldErrors.startDate && <span className="field-error" id="trip-start-error">{fieldErrors.startDate}</span>}</label><label>Return<input name="endDate" type="date" value={form.endDate} onChange={updateField} min={form.startDate || undefined} required aria-invalid={Boolean(fieldErrors.endDate)} aria-describedby={fieldErrors.endDate ? 'trip-end-error' : undefined} />{fieldErrors.endDate && <span className="field-error" id="trip-end-error">{fieldErrors.endDate}</span>}</label></div>
      <label>Description <span className="optional">(optional)</span><textarea name="description" value={form.description} onChange={updateField} placeholder="What are you looking forward to?" rows="3" /></label>
      {errorMessage && <p className="form-message form-error" role="alert">{errorMessage}</p>}
      <div className="form-actions"><Link className="cancel-link" to="/">Cancel</Link><button className="button" type="submit" disabled={saving}>{saving ? 'Creating trip…' : 'Create Trip'} <span aria-hidden="true">→</span></button></div>
    </form></div></PageShell>
}

function getTripCreationErrorMessage(error) {
  const message = error?.message?.toLowerCase() ?? ''
  if (error?.code === '42501' || message.includes('row-level security')) return 'This trip could not be saved for your account. Please sign in again and try once more.'
  if (message.includes('network') || message.includes('fetch')) return 'Could not reach Supabase. Check your connection and try again.'
  if (message.includes('valid_trip_dates') || message.includes('end_date')) return 'Check that the return date is the same as or later than the departure date.'
  return 'We could not create your trip. Your form entries are still here; please try again.'
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
    <Route path="/trips/:id/edit" element={<ProtectedRoute><EditTrip /></ProtectedRoute>} />
    <Route path="/trips/:id" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
    <Route path="/login" element={<AuthRoute><AuthPage /></AuthRoute>} />
    <Route path="/register" element={<AuthRoute><AuthPage register /></AuthRoute>} />
    <Route path="/supabase-check" element={<SupabaseCheck />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}

export default App
