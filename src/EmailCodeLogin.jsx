import { useState } from 'react'
import { supabase } from './supabaseClient.js'
import RoleSelector from './RoleSelector.jsx'
import CampusIcon from './CampusIcon.jsx'
import useEmailCooldown from './useEmailCooldown.js'

export default function EmailCodeLogin({email,setEmail,role,setRole,go,onBusy}) {
  const [target,setTarget]=useState('')
  const [code,setCode]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [info,setInfo]=useState('')
  const cooldown=useEmailCooldown()
  async function send(address) {
    const {error}=await supabase.auth.signInWithOtp({email:address,options:{shouldCreateUser:false}})
    if(error)throw error
    cooldown.start();setTarget(address);setCode('');setInfo('Code requested. If this email has a registered account, check its inbox and spam folder. Use the newest code.')
  }
  async function act(action) {
    if(busy)return
    setBusy(true);onBusy(true);setError('')
    try{await action()}catch(error){setError(error.message||'Could not complete sign-in. Please try again.')}
    finally{setBusy(false);onBusy(false)}
  }
  return <form className="passport-form email-code-form" aria-busy={busy} onSubmit={event=>{
    event.preventDefault();act(async()=>{
      if(!target){await send(email.trim());return}
      if(!/^\d{6}$/.test(code))throw new Error('Enter the six-digit code from your email.')
      const {data,error}=await supabase.auth.verifyOtp({email:target,token:code,type:'email'})
      if(error)throw new Error('This code is invalid or expired. Check the newest email or request a new code.')
      if(!data.session)throw new Error('No verified session was returned. Request a new code.')
      const {data:assigned,error:roleError}=await supabase.rpc('campus_role')
      if(roleError||assigned!==role){
        const {error:signOutError}=await supabase.auth.signOut({scope:'local'})
        setTarget('');setCode('');setInfo('')
        if(signOutError)throw signOutError
        if(roleError)throw new Error('Could not verify account permissions. Please try again or contact an administrator.')
        throw new Error(`Your account has ${assigned} access. Choose ${assigned} and request a new code. Staff access requires administrator assignment.`)
      }
      setCode('');go('dashboard')
    })
  }}><fieldset disabled={busy}><RoleSelector value={role} onChange={setRole} disabled={busy} login/>
    {!target?<label className="passport-field">Email<input name="email" type="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="Your registered account email"/></label>:<div className="email-code-challenge"><p>Signing in to <strong>{target}</strong></p><label className="passport-field">Email verification code<input className="email-code-input" name="verification_code" type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,''))} placeholder="000000" autoFocus aria-describedby="email-code-help"/></label><p id="email-code-help" className="password-hint">Enter all six digits. Codes are single-use and expire according to the email settings.</p></div>}
    {info&&<p className="auth-feedback success" role="status">{info}</p>}{error&&<p className="auth-feedback error" role="alert">{error}</p>}
    <button className="button button-primary passport-submit" type="submit" disabled={!target&&cooldown.remaining>0}>{busy?'Please wait…':target?'Verify code & log in':cooldown.remaining?`Request again in ${cooldown.remaining}s`:'Send login code'} <CampusIcon name="arrow" size={18}/></button>
    {target&&<div className="email-code-actions"><button type="button" className="section-link" disabled={cooldown.remaining>0} onClick={()=>act(()=>send(target))}>{cooldown.remaining?`Resend in ${cooldown.remaining}s`:'Resend code'}</button><button type="button" className="section-link" onClick={()=>{setTarget('');setCode('');setInfo('');setError('')}}>Use another email</button></div>}
  </fieldset><p className="passport-form-foot">Sign in with a fresh email code. No password is needed here.</p><button type="button" className="world-inline-link recovery-back" disabled={busy} onClick={()=>go('forgot-password')}>Account recovery</button></form>
}
