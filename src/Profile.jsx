import { ResourceRows } from './ResourceHub.jsx'
import CampusIcon from './CampusIcon.jsx'
import { supabase } from './supabaseClient.js'
import { useCampusData } from './campusData.js'

export default function Profile({user,role,library,saved,toggleSaved,go,logout,signingOut,logoutError}) {
  const identity=useCampusData(async()=>{const{data,error}=await supabase.from('member_profiles').select('*').eq('id',user.id).single();if(error)throw error;return data},[user.id])
  const name=user.user_metadata?.full_name||'Campus member'
  const initials=name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()
  const uploads=library.resources.filter(item=>item.uploaded_by===user.id)
  return <div className="profile-page"><section className="profile-hero"><span className="profile-monogram" aria-hidden="true">{initials}</span><div className="page-intro"><div className="eyebrow">Your campus identity · {role}</div><h1>{name}</h1><p>{user.email}</p><p>{user.user_metadata?.department||'Department not provided'}</p></div></section>
    {role==='student'&&<div className="privacy-note"><CampusIcon name="profile"/><div><strong>University student ID: {identity.loading?'Loading…':identity.data?.student_number||'Not assigned yet'}</strong><p>An administrator assigns your verified university ID for the attendance roster.</p>{identity.error&&<p role="alert">{identity.error}</p>}</div></div>}
    <div className="module-tabs"><button onClick={()=>go('courses')}><CampusIcon name="courses" size={17}/> Courses & attendance</button><button onClick={()=>go('upload')}><CampusIcon name="upload" size={17}/> Share a resource</button></div>
    <div className="profile-collections"><section><div className="section-title"><h2>Your saved collection</h2><button className="section-link" onClick={()=>go('resources')}>Browse library ↗</button></div><ResourceRows items={library.resources.filter(item=>saved.includes(item.id))} loading={library.loading} error={library.error} onRetry={library.reload} saved={saved} toggleSaved={toggleSaved} emptyMessage="Keep something useful close."/><p className="module-muted">Bookmarks stay with this account on this browser.</p></section><aside className="profile-side"><span className="eyebrow">A little contribution goes a long way</span><h3>Your shared knowledge</h3><p>{library.loading?'Loading your contributions…':library.error?'Your contributions are temporarily unavailable.':`${uploads.length} ${uploads.length===1?'resource':'resources'} uploaded by you.`}</p><button className="button button-secondary" onClick={()=>go('upload')}><CampusIcon name="upload" size={17}/> Upload a resource</button><hr/><h3>Account access</h3><p>Your assigned role is <strong>{role}</strong>. Administrators manage staff permissions.</p>{logoutError&&<p className="resource-error" role="alert">{logoutError}</p>}<button className="button button-secondary" disabled={signingOut} onClick={logout}>{signingOut?'Logging out…':'Log out of CampusOS'}</button></aside></div>
  </div>
}
