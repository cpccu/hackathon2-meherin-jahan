import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { announceSuccess, useCampusData } from './campusData.js'
import CampusIcon from './CampusIcon.jsx'
import { DataState } from './CampusUI.jsx'
import Dashboard from './Dashboard.jsx'
import Helpdesk from './Helpdesk.jsx'
import Academic from './Academic.jsx'
import Notices from './Notices.jsx'
import Events from './Events.jsx'
import LostFound from './LostFound.jsx'
import AdminPanel from './AdminPanel.jsx'
import { ResourceHub, UploadResource } from './ResourceHub.jsx'
import useResources, { readSavedResources } from './useResources.js'
import './campus.css'
import Profile from './Profile.jsx'
import UnsavedDialog from './UnsavedDialog.jsx'
import Transportation from './Transportation.jsx'
import Notifications from './Notifications.jsx'
import useNotifications from './useNotifications.js'

const navigation=[['dashboard','Home','⌂'],['resources','Resource Hub','▤'],['events','Clubs & Events','♧'],['lostfound','Lost & Found / Complaints','⌕'],['notices','Campus Notices','♢'],['transportation','Transportation',''],['courses','Courses & Attendance','▦'],['helpdesk','Smart Helpdesk','?'],['notifications','Notifications',''],['profile','Profile','○']]

export default function CampusShell({user,logout,signingOut,logoutError,page,go,menuOpen,setMenuOpen}) {
  const roleState=useCampusData(async()=>{
    const{data,error}=await supabase.from('account_roles').select('role').eq('user_id',user.id).single()
    if(error)throw error
    return data.role
  },[user.id])
  if(roleState.error) return <div className="module-state"><h1>Campus setup required</h1><p role="alert">{roleState.error}</p><p>The existing Resource Hub and Helpdesk data are preserved. Apply the new database migration to activate account roles and the new modules.</p><button className="button" onClick={roleState.reload}>Retry after setup</button> <button className="button button-secondary" onClick={logout}>Log out</button></div>
  return <DataState state={roleState}>{roleState.data&&<Workspace user={user} role={roleState.data} logout={logout} signingOut={signingOut} logoutError={logoutError} page={page} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>}</DataState>
}

function Workspace({user,role,logout:performLogout,signingOut,logoutError,page,go:navigate,menuOpen,setMenuOpen}) {
  const notifications=useNotifications(user)
  const [pendingNavigation,setPendingNavigation]=useState(null)
  const hasDraft=()=>Boolean(document.querySelector('form[data-dirty="true"]'))
  const go=next=>{if(next!==page&&hasDraft())setPendingNavigation({page:next});else navigate(next)}
  const logout=()=>{if(hasDraft())setPendingNavigation({logout:true});else performLogout()}
  const leave=()=>{document.querySelectorAll('form[data-dirty="true"]').forEach(form=>{form.dataset.dirty='false'});if(pendingNavigation.logout)performLogout();else navigate(pendingNavigation.page);setPendingNavigation(null)}
  useEffect(()=>{
    const beforeUnload=event=>{if(document.querySelector('form[data-dirty="true"]')){event.preventDefault();event.returnValue=''}}
    window.addEventListener('beforeunload',beforeUnload)
    return()=>window.removeEventListener('beforeunload',beforeUnload)
  },[])
  const library=useResources(user.id)
  const[saved,setSaved]=useState(()=>readSavedResources(user.id))
  const[notice,setNotice]=useState('')
  const[resourceQuery,setResourceQuery]=useState('')
  const[searchRevision,setSearchRevision]=useState(0)
  const[headerQuery,setHeaderQuery]=useState('')
  const[idle,setIdle]=useState(false)
  const[feedback,setFeedback]=useState('')
  const header=useRef(null)
  const sidebar=useRef(null)
  const name=user.user_metadata?.full_name||'Campus member'
  const initials=name.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase()
  const links=role==='admin'?[...navigation,['admin','Admin panel','⚙']]:navigation
  useEffect(()=>{try{localStorage.setItem(`campusos:saved:${user.id}`,JSON.stringify(saved))}catch{/* Session bookmarks remain usable. */}},[saved,user.id])
  useEffect(()=>{
    let timer
    const show=event=>{setFeedback(event.detail);clearTimeout(timer);timer=setTimeout(()=>setFeedback(''),6500)}
    window.addEventListener('campus:success',show)
    return()=>{window.removeEventListener('campus:success',show);clearTimeout(timer)}
  },[])
  useEffect(()=>{
    if(!menuOpen)return
    const previousFocus=document.activeElement
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    sidebar.current?.querySelector('.close-menu')?.focus()
    const onKey=event=>{
      if(event.key==='Escape'){setMenuOpen(false);return}
      if(event.key==='Tab'){
        const focusable=[...sidebar.current.querySelectorAll('button:not([disabled]),a[href]')]
        const first=focusable[0],last=focusable[focusable.length-1]
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
    }
    document.addEventListener('keydown',onKey)
    return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',onKey);previousFocus?.focus()}
  },[menuOpen,setMenuOpen])
  useEffect(()=>{
    let timer
    const wake=()=>{setIdle(false);clearTimeout(timer);timer=setTimeout(()=>{if(!header.current?.contains(document.activeElement)&&!header.current?.matches(':hover'))setIdle(true)},3500)}
    const events=['scroll','pointermove','pointerdown','keydown','touchstart']
    events.forEach(event=>window.addEventListener(event,wake,{passive:true}))
    wake()
    return()=>{clearTimeout(timer);events.forEach(event=>window.removeEventListener(event,wake))}
  },[])
  const searchResources=query=>{setResourceQuery(query);setSearchRevision(v=>v+1);go('resources')}
  const toggleSaved=id=>setSaved(current=>current.includes(id)?current.filter(v=>v!==id):[...current,id])
  const pages={
    dashboard:<Dashboard user={user} role={role} library={library} saved={saved} toggleSaved={toggleSaved} go={go} searchResources={searchResources}/>,
    resources:<ResourceHub key={searchRevision} initialQuery={resourceQuery} library={library} user={user} saved={saved} toggleSaved={toggleSaved} notice={notice} go={go}/>,
    upload:<UploadResource user={user} role={role} go={go} onUploaded={record=>{library.reload();setNotice(`Published: ${record.title}`);announceSuccess(`Published: ${record.title}`);go('resources')}}/>,
    helpdesk:<Helpdesk user={user} role={role}/>,events:<Events user={user} role={role}/>,lostfound:<LostFound user={user} role={role}/>,notices:<Notices user={user} role={role}/>,
    courses:<Academic user={user} role={role} library={library} go={go}/>,
    transportation:<Transportation role={role}/>,
    notifications:<Notifications user={user} state={notifications} go={go}/>,
    admin:role==='admin'?<AdminPanel user={user} go={go}/>:<p role="alert">Administrator access is required.</p>,
    profile:<Profile user={user} role={role} library={library} saved={saved} toggleSaved={toggleSaved} go={go} logout={logout} signingOut={signingOut} logoutError={logoutError}/>, 
  }
  return <div className="app-layout campus-workspace">{pendingNavigation&&<UnsavedDialog onKeep={()=>setPendingNavigation(null)} onLeave={leave}/>}<a className="skip-link" href="#workspace-content">Skip to content</a><aside id="campus-sidebar" ref={sidebar} className={`sidebar ${menuOpen?'open':''}`}><div className="sidebar-head"><div className="brand"><div className="brand-mark">C</div><div><strong>CampusOS</strong><span>City University</span></div></div><button className="close-menu" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}><CampusIcon name="close"/></button></div><div className="workspace-label">{role.toUpperCase()} WORKSPACE</div><nav>{links.map(([id,label])=><button key={id} className={page===id?'active':''} aria-current={page===id?'page':undefined} onClick={()=>go(id)}><CampusIcon name={id==='dashboard'?'home':id}/><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><button className="sidebar-profile" onClick={()=>go('profile')}><span className="avatar">{initials}</span><span><strong>{name}</strong><small>{role} account</small></span></button><button className="section-link" disabled={signingOut} onClick={logout}>Log out →</button>{logoutError&&<p role="alert">{logoutError}</p>}</div></aside><div className="mobile-scrim" onClick={()=>setMenuOpen(false)}/><main className="main-area"><header ref={header} className={`topbar campus-topbar ${idle?'is-idle':''}`} onFocus={()=>setIdle(false)} onMouseEnter={()=>setIdle(false)}><button className="menu-toggle" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="campus-sidebar" onClick={()=>setMenuOpen(true)}><CampusIcon name="menu"/></button><div className="campus-page-label"><small>City University</small><strong>{links.find(([id])=>id===page)?.[1]||'Upload resource'}</strong></div><form className="header-resource-search" onSubmit={event=>{event.preventDefault();searchResources(headerQuery.trim())}}><label className="search-box"><input type="search" aria-label="Search resources" placeholder="Search the Resource Hub…" value={headerQuery} onChange={e=>setHeaderQuery(e.target.value)}/></label><button className="section-link">Search</button></form><button className="icon-button notification-bell" aria-label={`Notifications${notifications.unread?`: ${notifications.unread} unread`:''}`} onClick={()=>go('notifications')}><CampusIcon name="notifications"/>{notifications.unread>0&&<span className="notification-count">{notifications.unread}</span>}</button><button className="topbar-avatar" aria-label="Open profile" onClick={()=>go('profile')}>{initials}</button></header><div className="page-content">{feedback&&<div className="campus-toast" role="status"><CampusIcon name="check" size={20}/><span>{feedback}</span><button aria-label="Dismiss message" onClick={()=>setFeedback('')}><CampusIcon name="close" size={18}/></button></div>}<div key={page} className="page-transition" id="workspace-content" tabIndex={-1}>{pages[page]||pages.dashboard}</div></div><nav className="bottom-nav campus-bottom-nav">{[['dashboard','Home'],['resources','Resources'],['events','Events'],['helpdesk','Help'],['menu','More']].map(([id,label])=><button key={id} className={page===id?'active':''} onClick={()=>id==='menu'?setMenuOpen(true):go(id)}><CampusIcon name={id==='dashboard'?'home':id} size={20}/><span>{label}</span></button>)}</nav></main></div>
}
