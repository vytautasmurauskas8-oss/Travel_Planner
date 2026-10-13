import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'

function CompassMark() {
  return <span className="brand-mark" aria-hidden="true">✳</span>
}

function Navigation() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    setLogoutError('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLogoutError('Could not sign out. Please try again.')
      console.error('Supabase sign out failed:', error)
      return
    }
    navigate('/login', { replace: true })
    setMobileMenuOpen(false)
  }

  return <header className="site-header">
    <Link className="brand" to="/" aria-label="Travel Planner home"><CompassMark /><span>travel<span className="brand-light">planner</span></span></Link>
    <button className="mobile-menu-toggle" type="button" aria-expanded={mobileMenuOpen} aria-controls="site-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? 'Close' : 'Menu'}</button>
    <div id="site-navigation" className={`site-navigation${mobileMenuOpen ? ' mobile-menu-open' : ''}`}>
      <nav className="main-nav" aria-label="Main navigation"><NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>My trips</NavLink><NavLink to="/trips/new" className="nav-create" onClick={() => setMobileMenuOpen(false)}>+ <span>New trip</span></NavLink></nav>
      <div className="account-nav">{!loading && (user
      ? <><span className="user-email">{user.email}</span><button className="nav-button" type="button" onClick={handleLogout}>Log out</button></>
      : <><NavLink to="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</NavLink><NavLink className="button button-small" to="/register" onClick={() => setMobileMenuOpen(false)}>Sign up</NavLink></>)}</div>
    </div>
    {logoutError && <p className="nav-error" role="alert">{logoutError}</p>}
  </header>
}

export default function PageShell({ children }) {
  return <><Navigation /><main className="page-content">{children}</main><footer className="site-footer"><span><CompassMark /> Make room for the good parts.</span><span>Thoughtfully planned, freely explored.</span></footer></>
}
