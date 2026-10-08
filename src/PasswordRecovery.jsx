import { useState } from 'react'
import { supabase } from './supabaseClient.js'
import Passport from './Passport.jsx'
import PasswordField from './PasswordField.jsx'
import CampusIcon from './CampusIcon.jsx'

export default function PasswordRecovery({reset,user,go}) {
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const back=()=>{window.history.replaceState({},'',window.location.pathname);go('login')}
  return <div className="passport-auth passport-recovery"><header className="passport-nav"><button className="world-brand" onClick={()=>go('landing')} aria-label="CampusOS home"><span>C</span><div><strong>CampusOS</strong><small>CITY UNIVERSITY</small></div></button><button className="world-inline-link" onClick={back}>Back to login ↗</button></header><main className="passport-layout"><Passport recovery/><section className="passport-form-panel"><span className="recovery-seal"><CampusIcon name="lock" size={25}/></span><span className="eyebrow">A way back / account recovery</span><h1>{reset?<>A fresh key.<br/><em>A familiar place.</em></>:<>Let’s get you<br/><em>back in.</em></>}</h1><p className="passport-form-intro">{reset?'Use your email recovery session to choose a new password.':'Enter your account email to request a recovery link.'}</p>
    {reset&&!user&&!message?<div className="auth-feedback error" role="alert">This recovery link has expired or is invalid. Request a new link.</div>:<form className="passport-form" aria-busy={busy} onSubmit={async event=>{
      event.preventDefault();if(busy)return;setError('');setMessage('');setBusy(true)
      try{
        if(reset){if(password!==confirm)throw new Error('Your passwords do not match.');const{error}=await supabase.auth.updateUser({password});if(error)throw error;const {error:signOutError}=await supabase.auth.signOut({scope:'local'});if(signOutError)throw signOutError;setMessage('Password updated. Sign in with a fresh email code.');setPassword('');setConfirm('');window.history.replaceState({},'',window.location.pathname)}
        else{const redirectTo=`${window.location.origin}${window.location.pathname}?recovery=1`;const{error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});if(error)throw error;setMessage('Recovery requested. If this email has an account, a link will be sent. Check your inbox and spam folder.')}
      }catch(error){setError(error.message||'Unable to complete recovery. Try again.')}finally{setBusy(false)}
    }}><fieldset disabled={busy||(reset&&Boolean(message))}>{reset?<><PasswordField label="New password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)}/><PasswordField label="Confirm password" name="confirm" autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)}/></>:<label className="passport-field">Email<input name="email" type="email" required autoComplete="email" placeholder="Your account email" value={email} onChange={event=>setEmail(event.target.value)}/></label>}<button className="button button-primary passport-submit">{busy?'Please wait…':reset?'Update password':'Request recovery link'} <CampusIcon name="arrow" size={18}/></button></fieldset></form>}
    {error&&<p className="auth-feedback error" role="alert">{error}</p>}{message&&<p className="auth-feedback success" role="status">{message}</p>}<button className="world-inline-link recovery-back" onClick={back}>{'← Back to login'}</button>{reset&&!user&&!message&&<button className="button button-secondary" onClick={()=>{window.history.replaceState({},'',window.location.pathname);go('forgot-password')}}>Request a new link</button>}
  </section></main><footer className="passport-footer">A little help finding your way. <span>CampusOS / City University</span></footer></div>
}
