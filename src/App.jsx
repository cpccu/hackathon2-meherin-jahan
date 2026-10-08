import { useEffect, useState } from 'react'
import Auth from './Auth.jsx'
import PasswordRecovery from './PasswordRecovery.jsx'
import CampusShell from './CampusShell.jsx'
import { supabase } from './supabaseClient.js'
import './App.css'
import './design.css'
import './creative.css'
import './transportation.css'
import Landing from './Landing.jsx'
import EmailVerification from './EmailVerification.jsx'
import { isEmailVerifiedSession } from './emailSession.js'

function App() {
  const [page, setPage] = useState(() => {const query=new URLSearchParams(window.location.search);return query.get('recovery')==='1'?'reset-password':query.get('verified')==='1'?'email-verified':'landing'})
  const [verifiedSession,setVerifiedSession]=useState(false)
  const [linkError]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('error_description')||'')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    let receivedEvent = false
    function applySession(session) {
      if (!active) return
      setUser(session?.user || null)
      const emailVerified=isEmailVerifiedSession(session)
      setVerifiedSession(emailVerified)
      setSessionError('')
      setAuthLoading(false)
      setPage(current => {
        const publicPage = ['landing', 'login', 'signup', 'forgot-password', 'reset-password','email-verified'].includes(current)
        if (session?.user && current === 'landing') return emailVerified?'dashboard':'login'
        if (session?.user && !emailVerified && !publicPage) return 'login'
        if (!session?.user && !publicPage) return 'login'
        return current
      })
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedEvent = true
      applySession(session)
      if (_event === 'PASSWORD_RECOVERY') setPage('reset-password')
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedEvent) return
      if (error) {
        setSessionError('Unable to restore your session. Please reload and try again.')
        setAuthLoading(false)
      } else {
        applySession(data.session)
      }
    }).catch(() => {
      if (active && !receivedEvent) {
        setSessionError('Unable to restore your session. Please reload and try again.')
        setAuthLoading(false)
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const go = (next) => { setPage(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }
  async function logout() {
    setSigningOut(true)
    setLogoutError('')
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      setUser(null)
      go('landing')
    } catch (error) {
      setLogoutError(error.message || 'Unable to log out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  if (authLoading) return <div className="empty-state" role="status">Loading your account…</div>
  if (sessionError) return <div className="empty-state" role="alert"><p>{sessionError}</p><button className="button button-primary" onClick={() => window.location.reload()}>Reload</button></div>
  if (page==='email-verified')return <EmailVerification user={user} go={go} linkError={linkError}/>
  if (page === 'forgot-password' || page === 'reset-password') return <PasswordRecovery key={page} reset={page === 'reset-password'} user={user} go={go} />
  if (page === 'landing') return <Landing go={go} />
  if (page === 'login' || page === 'signup' || !user || !verifiedSession) return <Auth page={page === 'signup' ? 'signup' : 'login'} go={go} />
  return <CampusShell key={user.id} user={user} logout={logout} signingOut={signingOut} logoutError={logoutError} page={page} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
}

export default App
