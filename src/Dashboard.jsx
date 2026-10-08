import { useState } from 'react'
import { ResourceRows } from './ResourceHub.jsx'
import { campusDate, readTable, useCampusData } from './campusData.js'
import { DataState } from './CampusUI.jsx'
import CampusIcon from './CampusIcon.jsx'

export default function Dashboard({ user, role, library, saved, toggleSaved, go, searchResources }) {
  const [query, setQuery] = useState('')
  const notices = useCampusData(() => readTable('campus_notices'), [user.id])
  const name = user.user_metadata?.full_name?.trim().split(/\s+/)[0] || 'Student'
  const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const uploads = library.resources.filter(item => item.uploaded_by === user.id)
  const savedItems = library.resources.filter(item => saved.includes(item.id))
  const stats = [
    ['Accessible resources', library.resources.length, 'Browse your library', 'resources'],
    ['My uploads', uploads.length, 'Share something useful', 'upload'],
    ['Saved resources', savedItems.length, 'Open your saved collection', 'profile'],
  ]
  return <div className="dashboard live-dashboard">
    <div className="welcome-row"><div><div className="eyebrow">{today}</div><h1>Welcome, <em>{name}.</em></h1><p>Your resources and campus guidance, together.</p></div><button className="button button-secondary" disabled={library.loading} onClick={library.reload}>Refresh resources</button></div>
    {role!=='student'&&<section className="staff-action"><div><strong>{role==='admin'?'Make campus information easier to find.':'Your teaching day, a little simpler.'}</strong><p>{role==='admin'?'Publish a sourced update or manage trusted staff access.':'Open your assigned courses, share material and record attendance.'}</p></div><button className="button button-light" onClick={()=>go(role==='admin'?'admin':'courses')}>{role==='admin'?'Open Admin panel':'Open teaching workspace'} <CampusIcon name="arrow" size={17}/></button></section>}
    <form className="dashboard-search" onSubmit={event => { event.preventDefault(); searchResources(query.trim()) }}>
      <label className="search-box"><CampusIcon name="search" size={20}/><input type="search" aria-label="Search the Resource Hub" placeholder="Search notes, courses, question papers or tags…" value={query} onChange={event => setQuery(event.target.value)} /></label><button className="button button-primary" type="submit">Search library <CampusIcon name="arrow" size={17}/></button>
    </form>
    <div className="dashboard-stats">{stats.map(([label, count, action, page]) => <button className="dashboard-stat" key={label} onClick={() => go(page)}><span>{label}</span><strong>{library.loading ? '…' : library.error ? '—' : count}</strong><small>{action} <span aria-hidden="true">→</span></small></button>)}</div>
    <section className="dashboard-modules"><div className="section-title"><h2>Your campus, connected</h2></div><div className="module-shortcuts">{[
      ['resources','Resource Hub','Find notes, past questions and course materials.'],
      ['helpdesk','Smart Helpdesk','Search campus guidance and official information.'],
      ['events','Clubs & Events','Discover activities, register and keep your ticket ready.'],
      ['lostfound','Lost & Found / Complaints','Report belongings or privately track a concern.'],
    ].map(([page,title,description])=><button key={page} className={`module-shortcut shortcut-${page}`} onClick={()=>go(page)}><span className="shortcut-icon"><CampusIcon name={page} size={25}/></span><span><strong>{title}</strong><small>{description}</small></span><CampusIcon name="arrow" size={18}/></button>)}</div></section>
    <div className="dashboard-grid"><div className="campus-banner" style={{ backgroundImage: 'url(/images/campus/City_University_Campus_in_Bloom.png)' }}><div className="banner-overlay" /><div className="banner-content"><span className="banner-tag">CAMPUSOS / YOUR COMMUNITY</span><h2>Your campus.<br />Your resources.<br /><em>One place.</em></h2><p>Find what you need. Share what helps.</p><button onClick={() => go('resources')}>Explore Resource Hub →</button></div></div><div className="quick-card"><div className="section-title"><h2>Quick actions</h2></div><div className="quick-actions">{[['upload', 'Upload resource', 'upload'], ['resources', 'Browse resources', 'resources'], ['helpdesk', 'Ask helpdesk', 'helpdesk'], ['profile', 'Saved resources', 'profile']].map(([symbol, title, page]) => <button className="quick-action" key={page} onClick={() => go(page)}><span><CampusIcon name={symbol} size={18}/></span><strong>{title}</strong><span aria-hidden="true">→</span></button>)}</div></div></div>
    <div className="dashboard-columns"><section><div className="section-title"><h2>Recent resources</h2><button className="section-link" onClick={() => go('resources')}>View all →</button></div><ResourceRows items={library.resources.slice(0, 5)} loading={library.loading} error={library.error} onRetry={library.reload} saved={saved} toggleSaved={toggleSaved} emptyMessage="Your library is ready for its first upload." /></section><aside className="side-column"><div className="section-title"><h2>Campus guidance</h2></div><div className="announcement-card"><span className="kicker">SMART HELPDESK</span><h3>A clearer answer starts here.</h3><p>Search published guides, routines and campus information. Each answer shows its source when available.</p><button onClick={() => go('helpdesk')}>Open Helpdesk →</button></div><div className="dashboard-tip"><h3>Keep useful resources close</h3><p>Use the star beside a resource to save it on this browser. Your saved collection is available in Profile.</p></div></aside></div>
    <section><div className="section-title"><h2>Latest campus & course notices</h2><button className="section-link" onClick={() => go('notices')}>View notices →</button></div><DataState state={notices}><div className="module-list">{notices.data?.slice(0,3).map(notice=><article className="module-panel" key={notice.id}><span className="category-tag">{notice.category}</span><h3>{notice.title}</h3><p>{notice.body.slice(0,220)}{notice.body.length>220?'…':''}</p><small>{campusDate(notice.created_at)}</small><p><button className="section-link" onClick={()=>go('notices')}>Read full notice →</button></p></article>)}</div>{notices.data?.length===0&&<p>No campus or course notices published yet.</p>}</DataState></section>
  </div>
}
