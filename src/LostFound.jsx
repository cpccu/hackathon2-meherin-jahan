import { useEffect, useState } from 'react'
import useDraftGuard from './useDraftGuard.jsx'
import { supabase } from './supabaseClient.js'
import { campusDate, campusError, dateParts, matchesSearch, memberName, readTable, useCampusData, writeTable } from './campusData.js'
import { ActionForm, CopyButton, DataState, EmptyState, ModuleIntro, MutationButton } from './CampusUI.jsx'
import CampusIcon from './CampusIcon.jsx'

function ItemPhoto({ path, title }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let objectUrl
    setUrl(''); setError('')
    supabase.storage.from('campus-photos').download(path).then(({ data, error }) => {
      if (!active) return
      if (error) { setError(campusError(error)); return }
      objectUrl = URL.createObjectURL(data); setUrl(objectUrl)
    }).catch(error => { if (active) setError(campusError(error)) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [path])
  return url ? <img className="item-photo" src={url} alt={title} loading="lazy" /> : <div className="photo-placeholder" role="status"><CampusIcon name="lostfound" size={32} /><p>{error || 'Loading item photo…'}</p></div>
}

function PhotoField() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <label className="full photo-field">Item photo<span className="module-muted">JPG, PNG or WebP · up to 5 MB</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required onChange={event => {
    const selected = event.target.files?.[0]
    setError('')
    if (selected && (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || !selected.size || selected.size > 5 * 1024 * 1024)) { setError('Choose a non-empty JPG, PNG or WebP photo up to 5 MB.'); event.target.value = ''; setFile(null) }
    else setFile(selected || null)
  }} />{preview && <img src={preview} className="photo-preview" alt="Selected item photo preview" />}{error && <span className="resource-error" role="alert">{error}</span>}</label>
}

export default function LostFound({ user, role }) {
  const state = useCampusData(async () => ({ items: await readTable('lost_found_posts'), complaints: await readTable('campus_complaints') }), [user.id])
  const [tab, setTab] = useState('items')
  const [guard, draftDialog] = useDraftGuard()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('Open')
  const [mine, setMine] = useState(false)
  const [complaintQuery, setComplaintQuery] = useState('')
  const [complaintStatus, setComplaintStatus] = useState('')
  const items = state.data?.items || []
  const complaints = state.data?.complaints || []
  const visible = items.filter(item => (!kind || kind === item.kind) && (!status || item.status === status) && (!mine || item.posted_by === user.id) && matchesSearch([item.title, item.description, item.location, item.posted_name], query))
  const visibleComplaints = complaints.filter(item => (!complaintStatus || item.status === complaintStatus) && matchesSearch([item.subject, item.body, item.id, item.admin_reply], complaintQuery))
  const filtered = Boolean(query.trim() || kind || mine || status !== 'Open')
  const clear = () => { setQuery(''); setKind(''); setStatus('Open'); setMine(false) }
  const todayParts = dateParts(new Date()).date
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`
  return <div className="community-module">{draftDialog}
    <ModuleIntro eyebrow="Help your campus community" title="Lost, found & heard">Reconnect belongings with their owners, or get a private concern to the right people.</ModuleIntro>
    <div className="module-tabs community-tabs"><button aria-pressed={tab === 'items'} onClick={() => { if(tab !== 'items') guard(() => setTab('items')) }}><CampusIcon name="lostfound" size={19} /> Lost & found</button><button aria-pressed={tab === 'complaints'} onClick={() => { if(tab !== 'complaints') guard(() => setTab('complaints')) }}><CampusIcon name="lock" size={19} /> {role === 'admin' ? 'Complaint inbox' : 'My complaints'}</button></div>
    <DataState state={state}>{state.data && (tab === 'items' ? <>
      <div className="module-metrics"><div><span className="metric-icon"><CampusIcon name="search" /></span><div><strong>{items.filter(item => item.kind === 'Lost' && item.status === 'Open').length}</strong><small>Open lost reports</small></div></div><div><span className="metric-icon"><CampusIcon name="lostfound" /></span><div><strong>{items.filter(item => item.kind === 'Found' && item.status === 'Open').length}</strong><small>Found items awaiting owners</small></div></div><button aria-pressed={mine} onClick={() => { setMine(value => !value); setStatus('') }}><span className="metric-icon"><CampusIcon name="profile" /></span><div><strong>{items.filter(item => item.posted_by === user.id).length}</strong><small>My reports</small></div><CampusIcon name="arrow" size={16} /></button></div>
      <details className="module-panel compose-panel"><summary><span><CampusIcon name="lostfound" /> Report a lost or found item</span><span className="compose-plus">+</span></summary><p className="module-muted">Include identifying details and a clear photo to help the right person recognize it.</p><ActionForm submit="Publish report" success="Your item report is published." onDone={state.reload} onSubmit={async values => {
        if (values.item_date > today) throw new Error('The item date cannot be in the future.')
        const file = values.photo
        const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
        if (!file?.size || !extensions[file.type] || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP photo up to 5 MB.')
        const path = `${user.id}/${crypto.randomUUID()}.${extensions[file.type]}`
        const { error } = await supabase.storage.from('campus-photos').upload(path, file, { contentType: file.type, upsert: false }); if (error) throw error
        try {
          const fields = { ...values }; delete fields.photo
          await writeTable('lost_found_posts', { ...fields, photo_path: path, posted_by: user.id, posted_name: memberName(user) })
        } catch (error) {
          const { error: cleanup } = await supabase.storage.from('campus-photos').remove([path])
          if (cleanup) throw new Error(`${campusError(error)} Photo cleanup failed; contact an administrator.`)
          throw error
        }
      }}><label>Report type<select name="kind"><option>Lost</option><option>Found</option></select></label><label>Item title<input name="title" required maxLength={200} placeholder="e.g. Black calculator in the library" /></label><label className="full">Description<textarea name="description" rows={4} required maxLength={5000} placeholder="Color, brand, identifying marks and useful details" /></label><label>Location<input name="location" required maxLength={200} placeholder="Where was it lost or found?" /></label><label>Date<input type="date" name="item_date" required max={today} defaultValue={today} /></label><PhotoField /><label className="full">Contact instructions<input name="contact" required maxLength={500} placeholder="Where or how should someone contact you?" /><small className="module-muted">Visible to signed-in CampusOS users.</small></label></ActionForm></details>
      <div className="module-filters filter-panel"><label className="wide-filter">Search reports<input type="search" placeholder="Item, description, location…" value={query} onChange={event => setQuery(event.target.value)} /></label><label>Report type<select value={kind} onChange={event => setKind(event.target.value)}><option value="">Lost & found</option><option>Lost</option><option>Found</option></select></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="Open">Open reports</option><option value="Resolved">Resolved reports</option><option value="">All statuses</option></select></label><div className="filter-checks"><label><input type="checkbox" checked={mine} onChange={event => setMine(event.target.checked)} /> My reports only</label></div></div>
      <div className="module-results"><h2>{visible.length} {visible.length === 1 ? 'report' : 'reports'}</h2><div>{filtered && <button className="section-link" onClick={clear}>Clear filters</button>}<button className="section-link" onClick={state.reload}><CampusIcon name="refresh" size={16} /> Refresh</button></div></div>
      {!visible.length && <EmptyState icon="lostfound" title={filtered ? 'No matching reports' : 'No open reports yet'} action={filtered ? <button className="button button-secondary" onClick={clear}>Show open reports</button> : null}>{filtered ? 'Try another keyword, report type or status.' : 'Lost something or found a belonging? Publish a report above to help reconnect it.'}</EmptyState>}
      <div className="module-list">{visible.map(item => <article className="module-panel item-card" key={item.id}><div className="item-card-top"><span className={`status-pill ${item.kind === 'Found' ? 'status-found' : 'status-lost'}`}>{item.kind}</span><span className={`status-pill ${item.status === 'Resolved' ? 'status-open' : 'status-muted'}`}>{item.status}</span></div>{item.photo_path && <ItemPhoto path={item.photo_path} title={item.title} />}<div className="item-card-content"><h2>{item.title}</h2><div className="card-detail"><CampusIcon name="location" size={17} /><span>{item.location} · {item.item_date}</span></div><p className="preserve-lines">{item.description}</p><details className="contact-details"><summary>Contact / return instructions</summary><p>{item.contact}</p></details><small className="module-muted">{item.posted_name} · {campusDate(item.created_at)}</small>{(item.posted_by === user.id || role === 'admin') && <MutationButton className="section-link" success={item.status === 'Open' ? 'Report marked resolved.' : 'Report reopened.'} action={() => writeTable('lost_found_posts', { status: item.status === 'Open' ? 'Resolved' : 'Open' }, item.id)} done={state.reload}>{item.status === 'Open' ? <><CampusIcon name="check" size={17} /> Mark resolved</> : 'Reopen report'}</MutationButton>}</div></article>)}</div>
    </> : <>
      <div className="privacy-note"><CampusIcon name="lock" /><div><strong>A private channel for your concern</strong><p>Your complaint and replies are visible only to you and administrators.</p></div></div>
      <details className="module-panel compose-panel"><summary><span><CampusIcon name="notices" /> Submit a complaint</span><span className="compose-plus">+</span></summary><ActionForm submit="Submit complaint" success="Complaint received. You can track its status below." onDone={state.reload} onSubmit={values => writeTable('campus_complaints', { ...values, submitted_by: user.id })}><label className="full">Subject<input name="subject" required maxLength={200} placeholder="A short description of your concern" /></label><label className="full">Details<textarea name="body" rows={5} required maxLength={5000} placeholder="Explain what happened, where and when, and how it could be resolved" /></label></ActionForm></details>
      <div className="module-filters filter-panel"><label className="wide-filter">Search complaints<input type="search" value={complaintQuery} onChange={event => setComplaintQuery(event.target.value)} placeholder="Subject or tracking ID…" /></label><label>Status<select value={complaintStatus} onChange={event => setComplaintStatus(event.target.value)}><option value="">All statuses</option>{['Received', 'In progress', 'Resolved'].map(status => <option key={status}>{status}</option>)}</select></label></div>
      <div className="module-results"><h2>{visibleComplaints.length} {role === 'admin' ? 'complaints in inbox' : 'complaints'}</h2><button className="section-link" onClick={state.reload}><CampusIcon name="refresh" size={16} /> Refresh status</button></div>
      {!visibleComplaints.length && <EmptyState icon="lock" title={complaints.length ? 'No matching complaints' : 'No complaints yet'}>{complaints.length ? 'Try a different search or status filter.' : role === 'admin' ? 'Student concerns will appear here when submitted.' : 'When you submit a concern, its receipt, status and responses will appear here.'}</EmptyState>}
      <div className="module-list">{visibleComplaints.map(item => <article className="module-panel complaint-card" key={item.id}><span className={`status-pill ${item.status === 'Resolved' ? 'status-open' : ''}`}>{item.status}</span><h2>{item.subject}</h2><p className="preserve-lines">{item.body}</p><ol className="complaint-progress">{['Received', 'In progress', 'Resolved'].map((step, index) => <li key={step} className={index <= ['Received', 'In progress', 'Resolved'].indexOf(item.status) ? 'complete' : ''}><span aria-hidden="true">{index + 1}</span>{step}</li>)}</ol><details className="tracking-details"><summary>Tracking #{item.id.slice(0, 8).toUpperCase()}</summary><code>{item.id}</code><CopyButton value={item.id} label="Copy tracking ID" /><small>{campusDate(item.created_at)}</small></details>{item.admin_reply ? <div className="admin-reply"><strong>Administrator’s response</strong><p className="preserve-lines">{item.admin_reply}</p></div> : <p className="module-muted">Awaiting an administrator’s response.</p>}{role === 'admin' && <details><summary>Update status & reply</summary><ActionForm reset={false} submit="Save response" success="Complaint status and response updated." onDone={state.reload} onSubmit={values => writeTable('campus_complaints', values, item.id)}><label>Status<select name="status" defaultValue={item.status}><option>Received</option><option>In progress</option><option>Resolved</option></select></label><label className="full">Reply<textarea name="admin_reply" defaultValue={item.admin_reply} maxLength={5000} rows={3} /></label></ActionForm></details>}</article>)}</div>
    </>)}</DataState>
  </div>
}