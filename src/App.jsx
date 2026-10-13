import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { checkSupabaseConnection } from './lib/supabase'
import './App.css'

function CompassMark() {
  return <span className="brand-mark" aria-hidden="true">✳</span>
}

function Navigation() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Travel Planner home">
        <CompassMark />
        <span>travel<span className="brand-light">planner</span></span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="/" end>My trips</NavLink>
        <NavLink to="/trips/new" className="nav-create">+ <span>New trip</span></NavLink>
      </nav>
      <div className="account-nav">
        <NavLink to="/login">Log in</NavLink>
        <NavLink className="button button-small" to="/register">Sign up</NavLink>
      </div>
    </header>
  )
}

function PageShell({ children }) {
  return <><Navigation /><main className="page-content">{children}</main><footer className="site-footer"><span><CompassMark /> Make room for the good parts.</span><span>Thoughtfully planned, freely explored.</span></footer></>
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
        <div className="empty-state">
          <div className="empty-art" aria-hidden="true"><span className="sun">☼</span><span className="art-line line-one"/><span className="art-line line-two"/><span className="art-line line-three"/><span className="art-plane">✈</span></div>
          <p className="eyebrow">THE MAP IS YOURS</p><h3>A fresh page. A thousand possibilities.</h3><p className="empty-copy">No trips just yet. Pick a place you’ve been dreaming about<br className="desktop-break" /> and let’s start putting it together.</p>
          <Link className="button" to="/trips/new">Create your first trip <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </PageShell>
  )
}

function DemoNotice() {
  return <p className="demo-note">This is a demo form. Nothing will be saved or sent.</p>
}

function NewTrip() {
  return <PageShell><div className="form-page"><Link className="back-link" to="/">← Back to your trips</Link><p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p><h1>Plan a new trip</h1><p className="intro">Start with the basics. The details can come later.</p><form className="form-card" onSubmit={(event) => event.preventDefault()}><label>Where are you headed?<input type="text" placeholder="e.g. Kyoto, Japan" /></label><div className="form-grid"><label>Departure<input type="date" /></label><label>Return<input type="date" /></label></div><label>Trip name <span className="optional">(optional)</span><input type="text" placeholder="A week among the temples" /></label><DemoNotice /><button className="button" type="submit">Start planning <span aria-hidden="true">→</span></button></form></div></PageShell>
}

function TripDetails() {
  const { id } = useParams()
  return <PageShell><div className="form-page details-page"><Link className="back-link" to="/">← Back to your trips</Link><div className="not-found-mark" aria-hidden="true">✳</div><p className="eyebrow">TRIP DETAILS</p><h1>Your next adventure</h1><p className="intro">Trip <code>{id}</code> is ready for its plans. Trip details will appear here when trips are available.</p><Link className="button" to="/trips/new">Plan a new trip <span aria-hidden="true">→</span></Link></div></PageShell>
}

function AuthPage({ register = false }) {
  const title = register ? 'Make it official.' : 'Good to have you back.'
  return <PageShell><div className="form-page auth-page"><div className="auth-mark"><CompassMark /></div><p className="eyebrow">{register ? 'YOUR NEXT CHAPTER' : 'PICK UP WHERE YOU LEFT OFF'}</p><h1>{title}</h1><p className="intro">{register ? 'Create an account to keep your travel ideas together.' : 'Sign in to find your trips and travel plans.'}</p><form className="form-card" onSubmit={(event) => event.preventDefault()}>{register && <label>Your name<input type="text" autoComplete="name" placeholder="Alex Traveler" /></label>}<label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" /></label><label>Password<input type="password" autoComplete={register ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label><DemoNotice /><button className="button button-full" type="submit">{register ? 'Create account' : 'Log in'} <span aria-hidden="true">→</span></button></form><p className="auth-switch">{register ? 'Already have an account?' : 'New around here?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p></div></PageShell>
}

function NotFound() {
  return <PageShell><div className="form-page not-found-page"><div className="not-found-mark" aria-hidden="true">404</div><p className="eyebrow">OFF THE MAP</p><h1>Looks like a wrong turn.</h1><p className="intro">We can’t find the page you’re looking for. Let’s get you back on track.</p><Link className="button" to="/">Back to your trips <span aria-hidden="true">→</span></Link></div></PageShell>
}

function SupabaseCheck() {
  const [result, setResult] = useState(null)

  useEffect(() => {
    let isCurrent = true
    checkSupabaseConnection().then((connectionResult) => {
      if (isCurrent) setResult(connectionResult)
    })
    return () => { isCurrent = false }
  }, [])

  return <main><h1>Supabase connection check</h1><p role="status" aria-live="polite">{result ? `${result.status}: ${result.message ?? result.error}` : 'Checking Supabase…'}</p><p>This check never displays configuration values. A successful anonymous query does not prove authenticated RLS access.</p></main>
}

function App() {
  return <Routes><Route path="/" element={<Dashboard />} /><Route path="/trips/new" element={<NewTrip />} /><Route path="/trips/:id" element={<TripDetails />} /><Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage register />} /><Route path="/supabase-check" element={<SupabaseCheck />} /><Route path="*" element={<NotFound />} /></Routes>
}

export default App
