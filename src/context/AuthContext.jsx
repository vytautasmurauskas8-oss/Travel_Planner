import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return undefined

    let receivedAuthEvent = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true
      setSession(nextSession)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Could not restore Supabase session:', error)
      if (!receivedAuthEvent) setSession(data?.session ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>{children}</AuthContext.Provider>
}
