import { useState } from 'react'
import { announceSuccess, campusError } from './campusData.js'
import CampusIcon from './CampusIcon.jsx'

export function DataState({ state, children }) {
  return <div className="data-boundary" aria-busy={state.loading}>
    {state.loading && !state.data && <div className="module-loading" role="status"><span className="loading-spinner" aria-hidden="true" /><span>Loading campus information…</span><div className="loading-skeleton" aria-hidden="true" /><div className="loading-skeleton" aria-hidden="true" /></div>}
    {state.loading && state.data && <p className="refresh-status" role="status"><span className="loading-spinner" aria-hidden="true"/> Refreshing campus information…</p>}
    {state.error && <div className="module-state" role="alert"><p>{state.error}</p><button className="button" onClick={state.reload}>Try again</button></div>}
    {state.data && children}
  </div>
}
export function ModuleIntro({ eyebrow, title, children }) { return <div className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{children}</p></div> }
export function ActionForm({ id, onSubmit, children, submit = 'Save', onDone, success = 'Saved successfully.', reset = true }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  return <form id={id} className="campus-form" onChange={event=>{event.currentTarget.dataset.dirty='true'}} onSubmit={async event => {
    event.preventDefault(); if (busy) return
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    for (const [key,value] of Object.entries(values)) if(typeof value==='string') values[key]=value.trim()
    const emptyRequired=[...form.querySelectorAll('[required]')].find(field=>typeof values[field.name]==='string'&&!values[field.name])
    if(emptyRequired){setError('Please complete every required field. Blank spaces do not count.');emptyRequired.focus();return}
    setBusy(true); setError(''); setMessage('')
    try { await onSubmit(values); form.dataset.dirty='false'; setMessage(success); announceSuccess(success); if(reset)form.reset(); onDone?.() } catch (error) { setError(campusError(error)) } finally { setBusy(false) }
  }}><fieldset disabled={busy}>{children}</fieldset>{error && <p role="alert" className="resource-error">{error}</p>}{message && <p role="status" className="resource-success">{message}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : submit}</button></form>
}
export function MutationButton({ action, children, done, className = 'button button-secondary', confirm, success }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming,setConfirming]=useState(false)
  async function run(){setBusy(true);setError('');try{await action();if(success)announceSuccess(success);setConfirming(false);done?.()}catch(error){setError(campusError(error))}finally{setBusy(false)}}
  return <div className="mutation-control">{confirming ? <div className="inline-confirm"><p>{confirm}</p><div><button type="button" className="button button-primary" disabled={busy} onClick={run}>{busy?'Please wait…':'Confirm'}</button><button type="button" className="button button-secondary" disabled={busy} onClick={()=>setConfirming(false)}>Keep it</button></div></div>:<button type="button" className={className} disabled={busy} onClick={()=>confirm?setConfirming(true):run()}>{busy?'Please wait…':children}</button>}{error && <p className="resource-error" role="alert">{error}</p>}</div>
}
export function EmptyState({icon='search',title,children,action}) { return <div className="module-empty"><span className="empty-icon"><CampusIcon name={icon} size={30}/></span><h3>{title}</h3><p>{children}</p>{action}</div> }
export function CopyButton({value,label='Copy code'}) {
  const[copied,setCopied]=useState(false)
  const[error,setError]=useState('')
  return <div><button className="section-link copy-button" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);setError('')}catch{setError('Copy manually: select the code above.')}}}><CampusIcon name={copied?'check':'copy'} size={16}/>{copied?'Copied':label}</button>{error&&<small role="status">{error}</small>}</div>
}
