import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { supabase, supabaseConfigError } from '../lib/supabase'
import PageShell from '../components/PageShell'

function useOwnedTrip(tripId, retryCount = 0) {
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
  }, [tripId, user.id, retryCount])

  return record.ownerId === user.id ? record : { status: 'loading', trip: null, message: '' }
}

function TripPageShell({ children }) {
  return <PageShell><div className="form-page details-page">{children}</div></PageShell>
}

function TripLoadState({ record, onRetry }) {
  if (record.status === 'loading') return <p className="trips-feedback" role="status">Loading trip…</p>
  if (record.status === 'error' || record.status === 'not_found') return <div className="trips-feedback trips-error" role="alert"><p>{record.message}</p>{record.status === 'error' && onRetry && <button className="text-button" type="button" onClick={onRetry}>Try again</button>}<Link className="button" to="/">Back to Dashboard</Link></div>
  return null
}

export function TripDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [retryCount, setRetryCount] = useState(0)
  const record = useOwnedTrip(id, retryCount)
  const [deleting, setDeleting] = useState(false)
  const deletingRef = useRef(false)
  const [actionError, setActionError] = useState('')

  async function deleteTrip() {
    if (!record.trip || deletingRef.current) return
    if (!window.confirm(`Delete "${record.trip.title}"? This cannot be undone.`)) return

    setActionError('')
    if (!supabase) {
      setActionError(supabaseConfigError)
      return
    }
    deletingRef.current = true
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
      deletingRef.current = false
      setDeleting(false)
    }
  }

  if (record.status !== 'success') return <TripPageShell><Link className="back-link" to="/">← Back to your trips</Link><TripLoadState record={record} onRetry={() => setRetryCount((count) => count + 1)} /></TripPageShell>

  const { trip } = record
  return <TripPageShell><Link className="back-link" to="/">← Back to your trips</Link><div className="not-found-mark" aria-hidden="true">✳</div><p className="eyebrow">TRIP DETAILS</p><h1>{trip.title}</h1><p className="intro">{trip.city}, {trip.country}</p><p className="trip-detail-dates">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</p>{trip.description && <p className="trip-description">{trip.description}</p>}
    {actionError && <p className="form-message form-error" role="alert">{actionError}</p>}
    <div className="trip-actions"><Link className="button" to={`/trips/${trip.id}/edit`}>Edit trip</Link><button className="button button-danger" type="button" onClick={deleteTrip} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete trip'}</button></div>
    <TripItinerary trip={trip} ownerId={user.id} />
  </TripPageShell>
}

function TripItinerary({ trip, ownerId }) {
  const [state, setState] = useState({ tripId: null, ownerId: null, status: 'loading', activities: [], message: '' })
  const [retryCount, setRetryCount] = useState(0)
  const [activeForm, setActiveForm] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const deletingActivityRef = useRef(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let isCurrent = true
    async function loadActivities() {
      setState({ tripId: trip.id, ownerId, status: 'loading', activities: [], message: '' })
      if (!supabase) {
        setState({ tripId: trip.id, ownerId, status: 'error', activities: [], message: supabaseConfigError })
        return
      }
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('id, trip_id, title, activity_date, activity_time, location, notes, is_completed')
          .eq('trip_id', trip.id)
          .order('activity_date', { ascending: true })
          .order('activity_time', { ascending: true, nullsFirst: false })
        if (!isCurrent) return
        if (error) {
          console.error('Could not load trip activities:', error)
          setState({ tripId: trip.id, ownerId, status: 'error', activities: [], message: 'We could not load the itinerary. Check your connection and try again.' })
          return
        }
        setState({ tripId: trip.id, ownerId, status: 'success', activities: data ?? [], message: '' })
      } catch (error) {
        if (!isCurrent) return
        console.error('Could not load trip activities:', error)
        setState({ tripId: trip.id, ownerId, status: 'error', activities: [], message: 'We could not load the itinerary. Check your connection and try again.' })
      }
    }
    loadActivities()
    return () => { isCurrent = false }
  }, [trip.id, ownerId, retryCount])

  const currentState = state.tripId === trip.id && state.ownerId === ownerId
    ? state
    : { status: 'loading', activities: [], message: '' }
  const days = getTripDays(trip.start_date, trip.end_date)

  async function confirmDeleteActivity() {
    if (!pendingDelete || deletingActivityRef.current) return
    setDeleteError('')
    if (!supabase) {
      setDeleteError(supabaseConfigError)
      return
    }
    deletingActivityRef.current = true
    setDeletingId(pendingDelete.id)
    try {
      const { data, error } = await supabase
        .from('activities')
        .delete()
        .eq('id', pendingDelete.id)
        .eq('trip_id', trip.id)
        .select('id')
      if (error) throw error
      if (!data?.length) {
        setDeleteError('This activity was not deleted. It may no longer exist or you may not have permission.')
        return
      }
      setState((current) => ({ ...current, activities: current.activities.filter((activity) => activity.id !== pendingDelete.id) }))
      setActiveForm((current) => current?.activityId === pendingDelete.id ? null : current)
      setPendingDelete(null)
    } catch (error) {
      console.error('Could not delete activity:', error)
      setDeleteError('We could not delete this activity. Please try again.')
    } finally {
      deletingActivityRef.current = false
      setDeletingId(null)
    }
  }

  return <section className="itinerary-section" aria-labelledby="itinerary-heading">
    <div className="itinerary-heading"><div><p className="eyebrow">THE DAY BY DAY</p><h2 id="itinerary-heading">Your itinerary</h2></div><span>{days.length} {days.length === 1 ? 'day' : 'days'}</span></div>
    {currentState.status === 'loading' && <p className="itinerary-feedback" role="status">Loading activities…</p>}
    {currentState.status === 'error' && <div className="itinerary-feedback itinerary-error" role="alert"><p>{currentState.message}</p><button type="button" className="text-button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div>}
    {currentState.status === 'success' && <div className="itinerary-days">{days.map((day) => {
      const dayActivities = currentState.activities.filter((activity) => activity.activity_date === day.date)
      return <article className="itinerary-day" key={day.date}>
        <div className="day-marker"><span>DAY</span><strong>{day.number}</strong></div>
        <div className="day-content"><div className="day-heading"><h3>{formatLongDate(day.date)}</h3><button className="add-activity-button" type="button" aria-expanded={activeForm?.type === 'create' && activeForm.day === day.date} onClick={() => setActiveForm((current) => current?.type === 'create' && current.day === day.date ? null : { type: 'create', day: day.date })}>{activeForm?.type === 'create' && activeForm.day === day.date ? 'Cancel' : '+ Add activity'}</button></div>
          {activeForm?.type === 'create' && activeForm.day === day.date && <ActivityForm key={`create-${day.date}`} trip={trip} day={day.date} ownerId={ownerId} onCancel={() => setActiveForm(null)} onCreated={(activity) => {
            setState((current) => current.tripId === trip.id && current.ownerId === ownerId
              ? { ...current, activities: [...current.activities, activity].sort(compareActivities) }
              : current)
            setActiveForm(null)
          }} />}
          {dayActivities.length === 0 && !(activeForm?.type === 'create' && activeForm.day === day.date) && <p className="no-activities">No activities planned yet.</p>}
          {dayActivities.length > 0 && <ul className="activity-list">{dayActivities.map((activity) => <li className="activity-item activity-item-managed" key={activity.id}>
            {activeForm?.type === 'edit' && activeForm.activityId === activity.id
              ? <ActivityForm key={`edit-${activity.id}`} trip={trip} day={day.date} ownerId={ownerId} activity={activity} onCancel={() => setActiveForm(null)} onUpdated={(updatedActivity) => {
                setState((current) => ({ ...current, activities: current.activities.map((item) => item.id === updatedActivity.id ? updatedActivity : item).sort(compareActivities) }))
                setActiveForm(null)
              }} />
              : <><div className="activity-time">{activity.activity_time ? formatTime(activity.activity_time) : 'Any time'}</div><div className="activity-info"><h4>{activity.title}{activity.is_completed && <span className="activity-complete">Completed</span>}</h4>{activity.location && <p>{activity.location}</p>}{activity.notes && <p className="activity-notes">{activity.notes}</p>}</div><div className="activity-actions"><button type="button" className="activity-action-button" onClick={() => setActiveForm({ type: 'edit', activityId: activity.id })} disabled={deletingId !== null}>Edit</button><button type="button" className="activity-action-button activity-delete-button" onClick={() => { setDeleteError(''); setPendingDelete(activity) }} disabled={deletingId !== null}>Delete</button></div></>}
          </li>)}</ul>}
        </div>
      </article>
    })}</div>}
    {pendingDelete && <div className="activity-dialog-backdrop"><section className="activity-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="activity-delete-title"><p className="eyebrow">REMOVE FROM ITINERARY</p><h3 id="activity-delete-title">Delete this activity?</h3><p>“{pendingDelete.title}” will be permanently deleted.</p>{deleteError && <p className="form-message form-error" role="alert">{deleteError}</p>}<div className="activity-dialog-actions"><button type="button" className="cancel-link" onClick={() => { if (!deletingId) { setPendingDelete(null); setDeleteError('') } }} disabled={deletingId !== null}>Cancel</button><button type="button" className="button button-danger" onClick={confirmDeleteActivity} disabled={deletingId !== null}>{deletingId === pendingDelete.id ? 'Deleting…' : 'Delete'}</button></div></section></div>}
  </section>
}

function ActivityForm({ trip, day, ownerId, onCancel, onCreated, onUpdated, activity = null }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: activity?.title ?? '',
    activity_date: activity?.activity_date ?? day,
    activity_time: activity?.activity_time ?? '',
    location: activity?.location ?? '',
    notes: activity?.notes ?? '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const isEditing = Boolean(activity)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrorMessage('')
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    if (savingRef.current) return
    const errors = {}
    if (!form.title.trim()) errors.title = 'Enter an activity name.'
    if (!form.activity_date || form.activity_date < trip.start_date || form.activity_date > trip.end_date) errors.activity_date = 'Choose a date within this trip.'
    if (form.activity_time && !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/.test(form.activity_time)) errors.activity_time = 'Enter a valid time.'
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      return
    }
    if (!user || user.id !== ownerId) {
      setErrorMessage('Your session changed. Reload the trip before saving this activity.')
      return
    }
    if (!supabase) {
      setErrorMessage(supabaseConfigError)
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      const changes = {
        title: form.title.trim(),
        activity_date: form.activity_date,
        activity_time: form.activity_time || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      }
      const selectedFields = 'id, trip_id, title, activity_date, activity_time, location, notes, is_completed'
      const result = isEditing
        ? await supabase.from('activities').update(changes).eq('id', activity.id).eq('trip_id', trip.id).select(selectedFields).maybeSingle()
        : await supabase.from('activities').insert({ ...changes, trip_id: trip.id, is_completed: false }).select(selectedFields).single()

      if (result.error) throw result.error
      if (!result.data) {
        setErrorMessage(`The activity was not ${isEditing ? 'updated' : 'saved'}. It may no longer exist or you may not have permission.`)
        return
      }
      if (isEditing) onUpdated(result.data)
      else onCreated(result.data)
    } catch (error) {
      console.error(`Could not ${isEditing ? 'update' : 'create'} activity:`, error)
      setErrorMessage(getActivitySaveErrorMessage(error, isEditing))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return <form className="activity-form" onSubmit={handleSubmit} noValidate>
    <p className="activity-form-date">{isEditing ? 'Edit activity' : `Adding to ${formatLongDate(day)}`}</p>
    <label>Activity name<input name="title" value={form.title} onChange={updateField} placeholder="Visit the bamboo grove" required autoFocus aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? 'activity-title-error' : undefined} />{fieldErrors.title && <span className="field-error" id="activity-title-error">{fieldErrors.title}</span>}</label>
    {isEditing && <label>Date<input name="activity_date" type="date" value={form.activity_date} min={trip.start_date} max={trip.end_date} onChange={updateField} required aria-invalid={Boolean(fieldErrors.activity_date)} aria-describedby={fieldErrors.activity_date ? 'activity-date-error' : undefined} />{fieldErrors.activity_date && <span className="field-error" id="activity-date-error">{fieldErrors.activity_date}</span>}</label>}
    <div className="form-grid"><label>Time <span className="optional">(optional)</span><input name="activity_time" type="time" step="1" value={form.activity_time} onChange={updateField} aria-invalid={Boolean(fieldErrors.activity_time)} aria-describedby={fieldErrors.activity_time ? 'activity-time-error' : undefined} />{fieldErrors.activity_time && <span className="field-error" id="activity-time-error">{fieldErrors.activity_time}</span>}</label><label>Location <span className="optional">(optional)</span><input name="location" value={form.location} onChange={updateField} placeholder="Arashiyama" /></label></div>
    <label>Description <span className="optional">(optional)</span><textarea name="notes" value={form.notes} onChange={updateField} rows="2" placeholder="A few details to remember" /></label>
    {errorMessage && <p className="form-message form-error" role="alert">{errorMessage}</p>}
    <div className="activity-form-actions"><button className="cancel-link" type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : (isEditing ? 'Save changes' : 'Save activity')}</button></div>
  </form>
}

function getActivitySaveErrorMessage(error, isEditing) {
  const message = error?.message?.toLowerCase() ?? ''
  if (error?.code === '42501' || message.includes('row-level security')) return 'You do not have permission to change activities in this trip.'
  if (message.includes('activity_date') || message.includes('within trip dates')) return 'Choose a date within this trip.'
  if (message.includes('network') || message.includes('fetch')) return 'Could not reach Supabase. Check your connection and try again.'
  return `We could not ${isEditing ? 'save your changes' : 'save this activity'}. Your entries are still here; please try again.`
}
function compareActivities(left, right) {
  const dateOrder = left.activity_date.localeCompare(right.activity_date)
  if (dateOrder !== 0) return dateOrder
  if (!left.activity_time) return right.activity_time ? 1 : 0
  if (!right.activity_time) return -1
  return left.activity_time.localeCompare(right.activity_time)
}

function getTripDays(startDate, endDate) {
  const dateValue = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  const start = dateValue(startDate)
  const end = dateValue(endDate)
  const days = []
  for (let current = start, number = 1; current <= end; current += 86400000, number += 1) {
    days.push({ number, date: new Date(current).toISOString().slice(0, 10) })
  }
  return days
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

function formatTime(time) {
  const [hours, minutes] = time.split(':')
  if (!/^\d{2}$/.test(hours ?? '') || !/^\d{2}$/.test(minutes ?? '')) return time
  return `${hours}:${minutes}`
}
function EditTripForm({ trip }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: trip.title, city: trip.city, country: trip.country, start_date: trip.start_date, end_date: trip.end_date, description: trip.description ?? '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

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
    if (savingRef.current) return
    if (!validateForm()) return
    if (!user || user.id !== trip.user_id) {
      setErrorMessage('Your session changed. Reload the trip before saving changes.')
      return
    }
    if (!supabase) {
      setErrorMessage(supabaseConfigError)
      return
    }

    savingRef.current = true
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
      savingRef.current = false
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
  const [retryCount, setRetryCount] = useState(0)
  const record = useOwnedTrip(id, retryCount)

  return <TripPageShell>{record.status === 'success'
    ? <EditTripForm key={record.trip.id} trip={record.trip} />
    : <><Link className="back-link" to="/">← Back to your trips</Link><TripLoadState record={record} onRetry={() => setRetryCount((count) => count + 1)} /></>}</TripPageShell>
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
