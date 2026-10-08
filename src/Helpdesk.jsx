import { useEffect, useState } from 'react'
import HelpdeskQuestions from './HelpdeskQuestions.jsx'
import { supabase } from './supabaseClient.js'
import { Attachment } from './Attachments.jsx'
import { campusError } from './campusData.js'

const categories = [
  ['all', 'All topics', 'Explore the helpdesk', 'rose'],
  ['bus', 'Bus information', 'Routes, schedules & passes', 'blue'],
  ['exam', 'Exam information', 'Dates & registration', 'amber'],
  ['rules', 'University rules', 'Policies & guidelines', 'violet'],
  ['academic', 'Academic information', 'Courses & resources', 'green'],
  ['general', 'General information', 'Everyday campus questions', 'teal'],
]

function TopicIcon({ topic }) {
  const drawings = {
    all: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    bus: <><rect x="5" y="3" width="14" height="16" rx="3" /><path d="M5 10h14M9 3v7M15 3v7M7 19v2M17 19v2M3 7v4M21 7v4" /><path d="M8 15h1M15 15h1" /></>,
    exam: <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 11h16M9 16l2 2 4-4" /></>,
    rules: <><path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    academic: <><path d="m2 9 10-5 10 5-10 5-10-5ZM6 11v6c3 3 9 3 12 0v-6M22 9v7" /></>,
    general: <><path d="M21 11a9 9 0 0 1-9 9H4l-2 2v-9a9 9 0 1 1 19-2Z" /><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 4M12 16h.01" /></>,
  }
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[topic]}</svg>
}

function sourceLink(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}

export default function Helpdesk({user,role}) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data, error: loadError } = await supabase.from('helpdesk').select('*').order('question')
        if (loadError) throw loadError
        if (active) setAnswers(data || [])
      } catch (loadError) {
        if (active) {
          setAnswers([])
          setError(['PGRST205', '42P01'].includes(loadError.code)
            ? 'The Helpdesk table is missing. Complete the Supabase database setup first.'
            : campusError(loadError))
        }
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [revision])

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matches = answers.filter(item => {
    const text = [item.question, item.answer, ...(item.keywords || [])].join(' ').toLowerCase()
    return (category === 'all' || item.category === category) && terms.every(term => text.includes(term))
  })

  return <div className="helpdesk-page">
    <div className="page-intro"><div className="eyebrow">Here to make things clearer</div><h1>How can we <em>help?</em></h1><p>Search campus information and CampusOS guides.</p></div>
    <label className="helpdesk-search">Search your question<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try question papers, private resources or buses" /></label>
    <div className="help-categories" aria-label="Filter answers by topic">
      {categories.map(([id, label, description, color]) => <button key={id} className={`help-category topic-${color} ${category === id ? 'selected' : ''}`} aria-pressed={category === id} onClick={() => setCategory(id)}>
        <span className="topic-card-top"><span className="topic-icon"><TopicIcon topic={id} /></span><span className="topic-count">{loading ? '…' : answers.filter(item=>id==='all'||item.category===id).length} answers</span><span className="topic-indicator" aria-hidden="true">{category === id ? '✓' : '↗'}</span></span>
        <span className="topic-title">{label}</span>
        <span className="topic-description">{description}</span>
      </button>)}
    </div>
    <div className="helpdesk-heading"><h2>Questions and answers</h2><div className="helpdesk-heading-actions">{(query.trim()||category!=='all')&&<button className="section-link" onClick={()=>{setQuery('');setCategory('all')}}>Clear filters</button>}<button className="button button-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh answers</button></div></div>
    {loading ? <p role="status">Loading answers…</p> : error ? <div role="alert"><p>{error}</p><button className="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div> : <>
      <p role="status">{matches.length} {matches.length === 1 ? 'answer' : 'answers'} found</p>
      {matches.length ? <div className="faq-list">{matches.map(item => {
        const expanded = open === item.id
        const url = sourceLink(item.source_url)
        return <div className={`faq-item ${expanded ? 'open' : ''}`} key={item.id}>
          <button aria-expanded={expanded} aria-controls={`answer-${item.id}`} onClick={() => setOpen(expanded ? null : item.id)}><span>{item.question}</span><span aria-hidden="true" className="faq-plus">{expanded ? '−' : '+'}</span></button>
          {expanded && <div className="faq-answer" id={`answer-${item.id}`}><p className="helpdesk-answer-text">{item.answer}</p><Attachment path={item.attachment_path} name={item.attachment_name}/><div className="helpdesk-source">Source: {url ? <a href={url} target="_blank" rel="noopener noreferrer">{item.source_label || 'Source document'}</a> : item.source_label || 'CampusOS guide'}{item.updated_at && <span> · Updated {new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium' }).format(new Date(item.updated_at))}</span>}</div></div>}
        </div>
      })}</div> : <div className="resource-empty"><h3>No answers found</h3><p>{query.trim() ? 'Try fewer words or another topic.' : 'No information has been published for this topic yet. Contact your department office for current campus guidance.'}</p><button className="button button-secondary" onClick={() => { setQuery(''); setCategory('all') }}>Show all answers</button></div>}
    </>}
    {user&&<HelpdeskQuestions user={user} role={role}/>}
  </div>
}
