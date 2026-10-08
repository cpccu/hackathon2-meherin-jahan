import { useState } from 'react'
import { QRTicket, EventCheckIn } from './EventQR.jsx'
import { supabase } from './supabaseClient.js'
import { campusDate, dateParts, matchesSearch, memberName, readTable, useCampusData, writeTable } from './campusData.js'
import { ActionForm, CopyButton, DataState, EmptyState, ModuleIntro, MutationButton } from './CampusUI.jsx'
import CampusIcon from './CampusIcon.jsx'

const types = ['Workshop', 'Contest', 'Seminar', 'Cultural', 'Sports', 'Other']

function EventFields({ event }) {
  const localTime = event ? new Date(new Date(event.starts_at).getTime() - new Date(event.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
  return <>
    <label>Event title<input name="title" required maxLength={200} defaultValue={event?.title} placeholder="Give the event a clear title" /></label>
    <label>Club / department<input name="club" required maxLength={160} defaultValue={event?.club} placeholder="Hosting club or department" /></label>
    <label>Type<select name="event_type" defaultValue={event?.event_type}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
    <label>Date and time (your local timezone)<input name="starts_at" type="datetime-local" required defaultValue={localTime} /></label>
    <label>Location<input name="location" required maxLength={200} defaultValue={event?.location} placeholder="Building, room or venue" /></label>
    <label>Description<textarea name="description" required rows={4} maxLength={5000} defaultValue={event?.description} placeholder="What to expect and what to bring" /></label>
  </>
}

export default function Events({ user, role }) {
  const state = useCampusData(async () => ({ events: await readTable('campus_events', 'starts_at'), registrations: await readTable('event_registrations') }), [user.id])
  const [query, setQuery] = useState('')
  const [club, setClub] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState('')
  const [showPast, setShowPast] = useState(false)
  const [mine, setMine] = useState(false)
  const events = state.data?.events || []
  const registrations = state.data?.registrations || []
  const myTickets = registrations.filter(item => item.user_id === user.id)
  const clubs = [...new Set(events.map(item => item.club))].sort()
  const visible = events.filter(event => {
    const parts = dateParts(event.starts_at).date
    return (!club || event.club === club) && (!type || event.event_type === type)
      && (!date || `${parts.year}-${parts.month}-${parts.day}` === date)
      && (showPast || new Date(event.starts_at) > new Date())
      && (!mine || myTickets.some(ticket => ticket.event_id === event.id))
      && matchesSearch([event.title, event.description, event.club, event.location], query)
  })
  const filtered = Boolean(query.trim() || club || type || date || mine)
  const clear = () => { setQuery(''); setClub(''); setType(''); setDate(''); setMine(false); setShowPast(false) }
  return <div className="events-module">
    <ModuleIntro eyebrow="Meet your community" title="Clubs & events">Discover your next workshop, contest or campus gathering. Register here and bring your ticket to the entrance.</ModuleIntro>
    <DataState state={state}>
      {state.data && <>
        <div className="module-metrics">
          <div><span className="metric-icon"><CampusIcon name="events" /></span><div><strong>{events.filter(event => new Date(event.starts_at) > new Date()).length}</strong><small>Upcoming events</small></div></div>
          <button onClick={() => { setMine(value => !value); setShowPast(true) }} aria-pressed={mine}><span className="metric-icon"><CampusIcon name="ticket" /></span><div><strong>{myTickets.length}</strong><small>My registrations</small></div><CampusIcon name="arrow" size={16} /></button>
          <div><span className="metric-icon"><CampusIcon name="courses" /></span><div><strong>{clubs.length}</strong><small>Hosting clubs & departments</small></div></div>
        </div>
        {role !== 'student' && <details className="module-panel compose-panel"><summary><span><CampusIcon name="events" /> Create a campus event</span><span className="compose-plus">+</span></summary><p className="module-muted">Add real event details so students can discover it and register.</p><ActionForm submit="Publish event" success="Event published. Students can now register." onDone={state.reload} onSubmit={values => {
          const starts_at = new Date(values.starts_at).toISOString()
          if (new Date(starts_at) <= new Date()) throw new Error('Choose a future event time.')
          return writeTable('campus_events', { ...values, starts_at, created_by: user.id })
        }}><EventFields /></ActionForm></details>}
        <div className="module-filters filter-panel">
          <label className="wide-filter">Search events<input type="search" placeholder="Title, club, location or topic…" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <label>Club<select value={club} onChange={event => setClub(event.target.value)}><option value="">All clubs</option>{clubs.map(club => <option key={club}>{club}</option>)}</select></label>
          <label>Type<select value={type} onChange={event => setType(event.target.value)}><option value="">All types</option>{types.map(type => <option key={type}>{type}</option>)}</select></label>
          <label>Event date (Bangladesh)<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
          <div className="filter-checks"><label><input type="checkbox" checked={showPast} onChange={event => setShowPast(event.target.checked)} /> Include past events</label><label><input type="checkbox" checked={mine} onChange={event => setMine(event.target.checked)} /> My registrations only</label></div>
        </div>
        <div className="module-results"><h2>{visible.length} {visible.length === 1 ? 'event' : 'events'}{mine ? ' in my registrations' : ''}</h2><div>{filtered && <button className="section-link" onClick={clear}>Clear filters</button>}<button className="section-link" onClick={state.reload}><CampusIcon name="refresh" size={16} /> Refresh</button></div></div>
        {!visible.length && <EmptyState icon="events" title={filtered ? 'No events match your filters' : 'No upcoming events yet'} action={filtered ? <button className="button button-secondary" onClick={clear}>Show all events</button> : null}>{filtered ? 'Try another club, date or keyword.' : role === 'student' ? 'New events will appear when a club or department publishes them.' : 'Publish your first event using the form above.'}</EmptyState>}
        <div className="module-list">{visible.map(event => <EventCard key={event.id} event={event} user={user} role={role} registrations={registrations.filter(ticket => ticket.event_id === event.id)} reload={state.reload} />)}</div>
      </>}
    </DataState>
  </div>
}

function EventCard({ event, user, role, registrations, reload }) {
  const ticket = registrations.find(ticket => ticket.user_id === user.id)
  const manager = role === 'admin' || (role === 'teacher' && event.created_by === user.id)
  const date = dateParts(event.starts_at)
  const upcoming = new Date(event.starts_at) > new Date()
  return <article className={`module-panel event-card type-${event.event_type.toLowerCase()}`}>
    <div className="event-card-header"><div className="event-date-block"><strong>{date.day}</strong><span>{date.month}</span></div><div><span className="status-pill">{event.event_type}</span><p>{event.club}</p></div><span className={`status-pill ${upcoming ? 'status-open' : 'status-muted'}`}>{upcoming ? 'Upcoming' : 'Past event'}</span></div>
    <h2>{event.title}</h2>
    <div className="card-detail"><CampusIcon name="clock" size={17} /><span>{campusDate(event.starts_at)} · Bangladesh time</span></div>
    <div className="card-detail"><CampusIcon name="location" size={17} /><span>{event.location}</span></div>
    <p className="preserve-lines event-description">{event.description}</p>
    {ticket ? <div className="event-ticket"><div className="ticket-heading"><CampusIcon name="ticket" /><strong>{ticket.checked_in_at ? 'Checked in — enjoy the event!' : 'Your place is registered'}</strong></div><p>Show your QR ticket or code to the organizer at the entrance.</p>{!ticket.checked_in_at&&<QRTicket event={event} ticket={ticket}/>}<code>{ticket.checkin_code}</code><CopyButton value={ticket.checkin_code} />{!ticket.checked_in_at && <MutationButton className="section-link muted-action" confirm="Cancel your registration for this event?" success="Registration cancelled." action={async () => { const { error } = await supabase.from('event_registrations').delete().eq('id', ticket.id); if (error) throw error }} done={reload}>Cancel registration</MutationButton>}</div> : upcoming ? <MutationButton className="button button-primary" success="You are registered. Your ticket code is ready." action={() => writeTable('event_registrations', { event_id: event.id, user_id: user.id, attendee_name: memberName(user) })} done={reload}><CampusIcon name="ticket" size={18} /> Register / RSVP</MutationButton> : <p className="module-muted">Registration has closed for this event.</p>}
    {manager && <details className="event-management"><summary>Attendees & check-in <span className="status-pill">{registrations.length}</span></summary><p className="module-muted">{registrations.filter(ticket => ticket.checked_in_at).length} checked in · {registrations.length} registered</p><EventCheckIn event={event} reload={reload}/>
    <div className="attendee-list">{registrations.map(ticket => <div key={ticket.id}><span>{ticket.attendee_name}</span><span className={`status-pill ${ticket.checked_in_at ? 'status-open' : ''}`}>{ticket.checked_in_at ? 'Checked in' : 'Registered'}</span></div>)}</div>{!registrations.length && <p>No registrations yet.</p>}
    {manager && <details><summary>Edit event details</summary><ActionForm submit="Save event details" success="Event details updated." onDone={reload} onSubmit={values => writeTable('campus_events', { ...values, starts_at: new Date(values.starts_at).toISOString() }, event.id)}><EventFields event={event} /></ActionForm></details>}
    <MutationButton className="section-link danger-action" confirm="Remove this event and all its registrations? This cannot be undone." success="Event removed." action={async () => { const { error } = await supabase.from('campus_events').delete().eq('id', event.id); if (error) throw error }} done={reload}>Remove event</MutationButton></details>}
  </article>
}