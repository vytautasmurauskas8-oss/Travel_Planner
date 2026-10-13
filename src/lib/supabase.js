import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const supabaseConfigError = !supabaseUrl || !supabasePublishableKey
  ? 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env.local file, then restart the dev server.'
  : null

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabasePublishableKey)

/**
 * Checks whether the Supabase API is reachable by reading the trips table.
 * An empty result is a successful connection. RLS may intentionally hide all
 * rows from a visitor who is not signed in, so this function never treats that
 * as a connection failure.
 */
export async function checkSupabaseConnection() {
  if (!supabase) {
    return { status: 'not_configured', error: supabaseConfigError }
  }

  let response
  try {
    response = await supabase.from('trips').select('id').limit(1)
  } catch (error) {
    console.error('Supabase connection check failed:', error)
    return { status: 'error', message: 'Could not reach Supabase. See the browser console for technical details.' }
  }

  const { data, error } = response

  if (error) {
    console.error('Supabase connection check failed:', error)
    return { status: 'error', message: 'Supabase returned an error. See the browser console for technical details.' }
  }

  if (data.length === 0) {
    return {
      status: 'api_reachable_rls_unverified',
      message: 'Supabase API is reachable. No trips were returned. This does not confirm that an authenticated user can read their trips; RLS may hide rows from this session.',
    }
  }

  return { status: 'api_reachable_rows_visible_rls_unverified', message: 'Supabase API is reachable and at least one trip row is visible. This alone does not verify access to a particular authenticated user’s trips.' }
}
