import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase, supabaseConfigError } from '../lib/supabase'
import PageShell from '../components/PageShell'

function useOwnedTrip(tripId) {
  const { user } = useAuth()
  const [record, setRecord] = useState({ ownerId: null, status: 'loading', trip: null, message: '' })

  useEffect(() => {
    let isCurrent = true

    async function loadTrip() {
      setRecord({ ownerId: user.id, status: 'loading', trip: null, message: '' })
      if (!supabase) {
        setRecord({ ownerId: user.id, status: 'error', trip: null, message: supabaseConfigError })
        return
      }

      try {
        const { data, error } = await supabase
          .from('trips')
          .select('id, user_id, title, city, country, start_date, end_date, description')
          .eq('id', tripId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!isCurrent) return
        if (error) {
          console.error('Could not load trip:', error)
          setRecord({ ownerId: user.id, status: 'error', trip: null, message: 'We could not load this trip. Check your connection and try again.' })
          return
        }
        if (!data) {
          setRecord({ ownerId: user.id, status: 'not_found', trip: null, message: 'Trip not found or you do not have permission to view it.' })
          return
        }
        setRecord({ ownerId: user.id, status: 'success', trip: data, message: '' })
      } catch (error) {
        if (!isCurrent) return
        console.error('Could not load trip:', error)
        setRecord({ ownerId: user.id, status: 'error', trip: null, message: 'We could not load this trip. Check your connection and try again.' })
      }
    }

    loadTrip()
    return () => { isCurrent = false }
  }, [tripId, user.id])

  return record.ownerId === user.id ? record : { status: 'loading', trip: null, message: '' }
}

function TripPageShell({ children }) {
  return <PageShell><div className="form-page details-page">{children}</div></PageShell>
}

function TripLoadState({ record }) {
  if (record.status === 'loading') return <p className="trips-feedback" role="status">Loading trip…</p>
  if (record.status === 'error' || record.status === 'not_found') return <div className="trips-feedback trips-error" role="alert"><p>{record.message}</p><Link className="button" to="/">Back to Dashboard</Link></div>
  return null
}

export function TripDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const record = useOwnedTrip(id)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')

  async function deleteTrip() {
    if (!record.trip || deleting) return
    const confirmed = window.confirm(`Delete “${record.trip.title}”? This cannot be undone.`)
    if (!confirmed) return

    setActionError('')
    setDeleting(true)
    try {
      const { data, error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id')

      if (error) throw error
      if (!data?.length) {
        setActionError('This trip was not deleted. It may no longer exist or you may not have permission to delete it.')
        return
      }
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Could not delete trip:', error)
      setActionError('We could not delete this trip. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (record.status !== 'success') return <TripPageShell><Link className="back-link" to="/">← Back to your trips</Link><TripLoadState record={record} /></TripPageShell>

  const { trip } = record
  return <TripPageShell><Link className="back-link" to="/">← Back to your trips</Link><div className="not-found-mark" aria-hidden="true">✳</div><p className="eyebrow">TRIP DETAILS</p><h1>{trip.title}</h1><p className="intro">{trip.city}, {trip.country}</p><p className="trip-detail-dates">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</p>{trip.description && <p className="trip-description">{trip.description}</p>}
    {actionError && <p className="form-message form-error" role="alert">{actionError}</p>}
    <div className="trip-actions"><Link className="button" to={`/trips/${trip.id}/edit`}>Edit trip</Link><button className="button button-danger" type="button" onClick={deleteTrip} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete trip'}</button></div>
  </TripPageShell>
}

function EditTripForm({ trip }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: trip.title, city: trip.city, country: trip.country, start_date: trip.start_date, end_date: trip.end_date, description: trip.description ?? '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)

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
    if (!form.start_date) errors.start_date = 'Choose a departure date.'
    if (!form.end_date) errors.end_date = 'Choose a return date.'
    if (form.start_date && form.end_date && form.end_date < form.start_date) errors.end_date = 'The return date cannot be before the departure date.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!validateForm()) return

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          title: form.title.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
          description: form.description.trim() || null,
        })
        .eq('id', trip.id)
        .eq('user_id', user.id)
        .select('id')

      if (error) throw error
      if (!data?.length) {
        setErrorMessage('No trip was updated. It may no longer exist or you may not have permission to edit it.')
        return
      }
      navigate(`/trips/${trip.id}`, { replace: true })
    } catch (error) {
      console.error('Could not update trip:', error)
      setErrorMessage(getUpdateErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return <><Link className="back-link" to={`/trips/${trip.id}`}>← Back to trip</Link><p className="eyebrow">MAKE IT YOURS</p><h1>Edit trip</h1><p className="intro">Update the details for {trip.title}.</p>
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <label>Trip name<input name="title" value={form.title} onChange={updateField} required aria-invalid={Boolean(fieldErrors.title)} />{fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}</label>
      <div className="form-grid"><label>City<input name="city" value={form.city} onChange={updateField} required aria-invalid={Boolean(fieldErrors.city)} />{fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}</label><label>Country<input name="country" value={form.country} onChange={updateField} required aria-invalid={Boolean(fieldErrors.country)} />{fieldErrors.country && <span className="field-error">{fieldErrors.country}</span>}</label></div>
      <div className="form-grid"><label>Departure<input name="start_date" type="date" value={form.start_date} onChange={updateField} required aria-invalid={Boolean(fieldErrors.start_date)} />{fieldErrors.start_date && <span className="field-error">{fieldErrors.start_date}</span>}</label><label>Return<input name="end_date" type="date" min={form.start_date || undefined} value={form.end_date} onChange={updateField} required aria-invalid={Boolean(fieldErrors.end_date)} />{fieldErrors.end_date && <span className="field-error">{fieldErrors.end_date}</span>}</label></div>
      <label>Description <span className="optional">(optional)</span><textarea name="description" value={form.description} onChange={updateField} rows="3" /></label>
      {errorMessage && <p className="form-message form-error" role="alert">{errorMessage}</p>}
      <div className="form-actions"><Link className="cancel-link" to={`/trips/${trip.id}`}>Cancel</Link><button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <span aria-hidden="true">→</span></button></div>
    </form>
  </>
}

export function EditTrip() {
  const { id } = useParams()
  const record = useOwnedTrip(id)

  return <TripPageShell>{record.status === 'success'
    ? <EditTripForm key={record.trip.id} trip={record.trip} />
    : <><Link className="back-link" to="/">← Back to your trips</Link><TripLoadState record={record} /></>}</TripPageShell>
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

function getUpdateErrorMessage(error) {
  const message = error?.message?.toLowerCase() ?? ''
  if (error?.code === '42501' || message.includes('row-level security')) return 'You do not have permission to update this trip.'
  if (message.includes('valid_trip_dates') || message.includes('end_date')) return 'Check that the return date is the same as or later than the departure date.'
  return 'We could not save your changes. Your form entries are still here; please try again.'
}
