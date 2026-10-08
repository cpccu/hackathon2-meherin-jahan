import { useState } from 'react'
import { supabase } from './supabaseClient.js'
import Passport from './Passport.jsx'
import CampusIcon from './CampusIcon.jsx'

export default function EmailVerification({user,go,linkError}) {
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const verified=Boolean(user?.email_confirmed_at)&&!linkError
  async function continueToLogin() {
    if(busy)return
    setBusy(true);setError('')
    try {
      if(user){const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error}
      window.history.replaceState({},'',window.location.pathname)
      go('login')
    } catch(error) {
      setError(error.message||'Unable to close verification. Try again.')
    } finally {setBusy(false)}
  }
  return <div className="passport-auth"><header className="passport-nav"><span className="world-brand"><span>C</span><strong>CampusOS</strong></span></header><main className="passport-layout"><Passport/><section className="passport-form-panel"><span className="confirmation-mark"><CampusIcon name={verified?'check':'notices'} size={30}/></span><span className="eyebrow">Email verification</span><h1>{verified?<>Your email.<br/><em>Verified.</em></>:<>Let’s verify<br/><em>your email.</em></>}</h1><p className="passport-form-intro" role="status">{verified?'Your email is confirmed. Continue to login and request a fresh code. Staff permissions still require administrator approval.':linkError||'No verified email session was found. The link may be expired, already used or opened incorrectly. Go to account creation to request another confirmation email.'}</p>{error&&<p className="auth-feedback error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy} onClick={continueToLogin}>{busy?'Please wait…':'Continue to login'}</button></section></main></div>
}
