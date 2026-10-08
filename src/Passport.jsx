import { useState } from 'react'
import CampusIcon from './CampusIcon.jsx'
import CampusScene from './CampusScene.jsx'
import usePointerDepth from './usePointerDepth.js'

const roleCopy={student:['profile','A place to learn. People to meet.'],teacher:['courses','Share knowledge. Make a difference.'],admin:['admin','Keep your campus connected.']}
export default function Passport({role='student',name='',department='',step=0,completed=[],signup=false,recovery=false}) {
  const [opened,setOpened]=useState(false)
  const ref=usePointerDepth()
  const [icon,copy]=roleCopy[role]
  return <aside className={`passport-desk desk-${role} ${recovery?'desk-recovery':''}`} ref={ref} aria-label="CampusOS decorative passport preview"><div className="desk-heading"><span className="eyebrow">City University / a place for you</span><h2>{recovery?<>Let’s find<br/>your way <em>back.</em></>:<>Your next chapter<br/>starts <em>here.</em></>}</h2><p>{recovery?'A quiet moment. A simple next step.':copy}</p></div><div className="desk-object" aria-hidden="true"><div className="desk-paper"><span>A LITTLE MORE CONNECTED</span><CampusScene compact active={role==='teacher'?'resources':role==='admin'?'helpdesk':'events'}/></div><div className="desk-pencil"/><div className="desk-flower">✳</div></div><div className={`campus-passport ${opened?'passport-open':''}`}>
    <div className="passport-inside"><span className="eyebrow">Your CampusOS journey</span><strong>{name.trim().split(/\s+/)[0]||'Hello, campus member.'}</strong><p>{department||'A community to belong to.'}</p><span className="passport-request">{signup?'Requested account type':'Account type'}: {role}</span>{signup&&<div className="passport-marks" aria-label={`Form step ${step+1} of 3`}>{['About you','Access','Review'].map((label,index)=><span key={label} className={completed[index]?'complete':''}><CampusIcon name={completed[index]?'check':'edit'} size={14}/>{label}</span>)}</div>}<small>Decorative preview · not a university ID</small></div>
    <div className="passport-cover" aria-hidden="true"><div className="passport-emboss">C</div><span>CAMPUSOS</span><strong>Campus<br/>passport.</strong><CampusIcon name={recovery?'lock':icon} size={32}/><span className="passport-cover-foot">CITY UNIVERSITY / {role.toUpperCase()}</span><div className="passport-ribbon"/></div>
  </div><button type="button" className="passport-explore" aria-expanded={opened} onClick={()=>setOpened(value=>!value)}>{opened?'Close your passport':'Explore your passport'} <span aria-hidden="true">{opened?'↙':'↗'}</span></button><p className="passport-note">{signup&&role!=='student'?'A role request does not grant staff access.':'An invitation to campus life. Not an official identity document.'}</p></aside>
}

