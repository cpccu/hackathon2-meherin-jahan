import { useState } from 'react'
import { supabase } from './supabaseClient.js'

const departments = [
  'Computer Science & Engineering (CSE)',
  'Textile Engineering (TE)',
  'Electrical & Electronic Engineering (EEE)',
  'Civil Engineering (CE)',
  'Pharmacy',
  'Mechanical Engineering (ME)',
  'English',
  'Law',
  'Business Administration (DBA/BBA)',
  'Agriculture',
  'General Education (GED)',
]

export default function Auth({ page, go }) {
  const login = page === 'login'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setMessageType('error')

    if (!login && password !== confirmPassword) {
      setMessage('Your passwords do not match.')
      return
    }

    setLoading(true)
    try {
      if (login) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        go('dashboard')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, department } },
        })
        if (error) throw error

        if (data.session) {
          go('dashboard')
        } else {
          setMessageType('success')
          setMessage('Account created. Check your email for a confirmation link, then log in.')
        }
      }
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual" style={{ backgroundImage: "url('/images/campus/City_University_Campus_Gate.png')" }}>
        <div className="auth-overlay" />
        <div className="auth-visual-content">
          <div className="brand brand-light"><div className="brand-mark">C</div><div><strong>CampusOS</strong><span>City University</span></div></div>
          <div className="auth-quote"><span>“</span><h2>The best campus experience starts with knowing where to look.</h2><p>One simple place for your next step at City University.</p></div>
          <div className="auth-location"><span className="live-dot" /> City University · Savar, Bangladesh</div>
        </div>
      </div>
      <div className="auth-form-wrap">
        <button className="back-link" onClick={() => go('landing')}>← Back to home</button>
        <div className="auth-form">
          <div className="mobile-brand"><div className="brand"><div className="brand-mark">C</div><div><strong>CampusOS</strong><span>City University</span></div></div></div>
          <div className="eyebrow">{login ? 'Welcome back' : 'Join the community'}</div>
          <h1>{login ? 'Your campus, waiting.' : 'Start your campus journey.'}</h1>
          <p className="auth-intro">{login ? 'Sign in to continue to your student hub.' : 'Create your account and bring campus closer.'}</p>
          <form onSubmit={handleSubmit}>
            {!login && <label>Full name<input required type="text" autoComplete="name" placeholder="Your full name" value={fullName} onChange={event => setFullName(event.target.value)} /></label>}
            <label>Student email<input required type="email" autoComplete="email" placeholder="name@cityuniversity.edu.bd" value={email} onChange={event => setEmail(event.target.value)} /></label>
            {!login && <label>Department<select required value={department} onChange={event => setDepartment(event.target.value)}><option value="" disabled>Select your department</option>{departments.map(item => <option key={item}>{item}</option>)}</select></label>}
            <label>Password<input required type="password" autoComplete={login ? 'current-password' : 'new-password'} minLength={6} placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} /></label>
            {!login && <label>Confirm password<input required type="password" autoComplete="new-password" minLength={6} placeholder="Repeat your password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>}
            {login && <div className="form-options"><label className="checkbox"><input type="checkbox" /> <span>Remember me</span></label><button type="button" className="forgot" onClick={() => setMessage('Password reset is not set up yet. Ask an administrator to help you.')}>Forgot password?</button></div>}
            {message && <p className={`auth-feedback ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
            <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Please wait…' : login ? 'Log in to CampusOS' : 'Create my account'} <span aria-hidden="true">→</span></button>
          </form>
          <p className="switch-auth">{login ? 'New to CampusOS?' : 'Already have an account?'} <button onClick={() => go(login ? 'signup' : 'login')}>{login ? 'Create an account' : 'Log in'}</button></p>
        </div>
      </div>
    </div>
  )
}
