import { useState } from 'react'
import { supabase } from './supabaseClient.js'
import CampusIcon from './CampusIcon.jsx'
import useEmailCooldown from './useEmailCooldown.js'

export default function SignupConfirmation({email,role,go,heading,configurationError}) {
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [info,setInfo]=useState('')
  const cooldown=useEmailCooldown(true)
  return <div className="signup-confirmation"><span className="confirmation-mark"><CampusIcon name="notices" size={30}/></span><span className="eyebrow">Verify your email</span><h1 ref={heading} tabIndex={-1}>Check your <em>inbox.</em></h1>
    {configurationError?<p className="auth-feedback error" role="alert">Email confirmation is not enabled for this project. Your session was closed. Ask the administrator to enable Confirm email before new members register.</p>:<p role="status">Your signup was submitted. Open the confirmation email for <strong>{email}</strong> and click <strong>Verify email</strong>. After verification, sign in with an email code. Check your spam folder too.</p>}
    {role!=='student'&&<p className="signup-role-guidance">Staff access requires administrator approval. Your account begins with Student access.</p>}
    {error&&<p className="auth-feedback error" role="alert">{error}</p>}{info&&<p className="auth-feedback success" role="status">{info}</p>}
    {!configurationError&&<button className="button button-secondary" disabled={busy||cooldown.remaining>0} onClick={async()=>{
      if(busy||cooldown.remaining)return;setBusy(true);setError('');setInfo('')
      try{const {error}=await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:`${window.location.origin}${window.location.pathname}?verified=1`}});if(error)throw error;cooldown.start();setInfo('Another confirmation email was requested. Check your inbox and spam folder.')}
      catch(error){setError(error.message||'Could not request another email. Try again.')}
      finally{setBusy(false)}
    }}>{busy?'Requesting…':cooldown.remaining?`Resend in ${cooldown.remaining}s`:'Resend verification email'}</button>}
    <button className="button button-primary" onClick={()=>go('login')}>Go to login <CampusIcon name="arrow" size={18}/></button>
  </div>
}
