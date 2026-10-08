import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import EmailCodeLogin from './EmailCodeLogin.jsx'
import SignupConfirmation from './SignupConfirmation.jsx'
import RoleSelector from './RoleSelector.jsx'
import Passport from './Passport.jsx'
import PasswordField from './PasswordField.jsx'
import CampusIcon from './CampusIcon.jsx'
import { detailsError, accessError } from './authValidation.js'

const departments=['Computer Science & Engineering (CSE)','Textile Engineering (TE)','Electrical & Electronic Engineering (EEE)','Civil Engineering (CE)','Pharmacy','Mechanical Engineering (ME)','English','Law','Business Administration (DBA/BBA)','Agriculture','General Education (GED)']
const steps=['About you','Account access','Review & create']

export default function Auth({page,go}) {
  const login=page==='login'
  const [fullName,setFullName]=useState('')
  const [email,setEmail]=useState('')
  const [department,setDepartment]=useState('')
  const [password,setPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [role,setRole]=useState('student')
  const [step,setStep]=useState(0)
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(false)
  const [created,setCreated]=useState(false)
  const [configurationError,setConfigurationError]=useState(false)
  const heading=useRef(null)
  const previous=useRef({step,login})
  useEffect(()=>{
    if(previous.current.login!==login)setMessage('')
    if(previous.current.step!==step||previous.current.login!==login)heading.current?.focus({preventScroll:true})
    previous.current={step,login}
  },[step,login])
  useEffect(()=>{if(created)heading.current?.focus({preventScroll:true})},[created])
  const completed=[!detailsError(fullName,department),!accessError(email,password,confirmPassword),false]
  const guidance='Staff access requires administrator approval. Your account begins with Student access.'
  function validateDetails() {
    const error=detailsError(fullName,department)
    if(error){setStep(0);throw new Error(error)}
  }
  function validateAccess() {
    const error=accessError(email,password,confirmPassword)
    if(error){setStep(1);throw new Error(error)}
  }
  async function submit(event) {
    event.preventDefault();if(loading)return;setMessage('')
    try {
      validateDetails();if(step===0){setStep(1);return}validateAccess();if(step===1){setStep(2);return}
      setLoading(true)
      const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:`${window.location.origin}${window.location.pathname}?verified=1`,data:{full_name:fullName.trim(),department,requested_role:role}}});if(error)throw error
      if(data.session){setConfigurationError(true);const {error:closeError}=await supabase.auth.signOut({scope:'local'});if(closeError)throw closeError}
      setCreated(true);setPassword('');setConfirmPassword('')
    }catch(error){setMessage(error.message||'Could not complete your request. Please try again.')}
    finally{setLoading(false)}
  }
  return <div className="passport-auth"><header className="passport-nav"><button className="world-brand" onClick={()=>go('landing')} aria-label="CampusOS home"><span>C</span><div><strong>CampusOS</strong><small>CITY UNIVERSITY</small></div></button><button className="world-inline-link" onClick={()=>go('landing')}>Back to campus <span aria-hidden="true">↗</span></button></header><main className="passport-layout"><Passport role={role} name={fullName} department={department} step={step} completed={completed} signup={!login}/><section className="passport-form-panel"><div className="account-mode" role="group" aria-label="Account pages"><button aria-pressed={login} disabled={loading} onClick={()=>go('login')}>Log in</button><button aria-pressed={!login} disabled={loading} onClick={()=>go('signup')}>Create account</button></div>
    {!login&&created?<SignupConfirmation email={email.trim()} role={role} go={go} heading={heading} configurationError={configurationError}/>:<>
      <span className="eyebrow">{login?'Welcome back / your campus passport':'A new chapter / your campus passport'}</span><h1 ref={heading} tabIndex={-1}>{login?<>Good to have<br/>you <em>back.</em></>:step===0?<>Make yourself<br/><em>at home.</em></>:step===1?<>A key to your<br/><em>campus day.</em></>:<>Ready for your<br/><em>next chapter?</em></>}</h1><p className="passport-form-intro">{login?'A fresh email code opens your campus. Choose your assigned account type.':step===0?'Tell us a little about yourself. Let’s find your place.':step===1?'Choose your email and account password. Regular login uses a fresh email code.':'A quick look at your details before you join.'}</p>
      {!login&&<ol className="signup-progress" aria-label="Account creation progress">{steps.map((label,index)=><li key={label} aria-current={step===index?'step':undefined}><button type="button" disabled={loading||(index===1&&!completed[0])||(index===2&&!(completed[0]&&completed[1]))} onClick={()=>setStep(index)}><span>{completed[index]?<CampusIcon name="check" size={13}/>:index+1}</span>{label}</button></li>)}</ol>}
      {login?<EmailCodeLogin email={email} setEmail={setEmail} role={role} setRole={setRole} go={go} onBusy={setLoading}/>:<form className="passport-form" onSubmit={submit} aria-busy={loading}><fieldset disabled={loading}><div className="signup-step" key={step}>
        {(step===0)&&<RoleSelector value={role} onChange={setRole} disabled={loading} login={false}/>}
        {step===0&&<><p className="signup-role-guidance">{role==='student'?'Join as a student. Verify your email to finish account creation.':guidance}</p><label className="passport-field">Full name<input name="full_name" required autoComplete="name" value={fullName} onChange={event=>setFullName(event.target.value)} placeholder="Your full name"/></label><label className="passport-field">Department<select name="department" required value={department} onChange={event=>setDepartment(event.target.value)}><option value="" disabled>Choose your department</option>{departments.map(item=><option key={item}>{item}</option>)}</select></label></>}
        {(step===1)&&<><label className="passport-field">Email<input name="email" type="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="Your account email"/></label><PasswordField value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password"/>{<><p className="password-hint">At least 6 characters. Use a password you don’t use elsewhere.</p><PasswordField label="Confirm password" name="confirm_password" autoComplete="new-password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)}/></>}</>}
        {step===2&&<div className="signup-review"><dl><div><dt>Name</dt><dd>{fullName}</dd></div><div><dt>Department</dt><dd>{department}</dd></div><div><dt>Requested account type</dt><dd>{role}</dd></div><div><dt>Email</dt><dd>{email}</dd></div><div><dt>Password</dt><dd>Provided securely</dd></div></dl><div><button type="button" className="world-inline-link" onClick={()=>setStep(0)}>Edit personal details</button><button type="button" className="world-inline-link" onClick={()=>setStep(1)}>Edit account access</button></div><p className="signup-role-guidance">{role==='student'?'Your account receives Student access. Email verification is required before signing in.':guidance}</p></div>}
      </div>{message&&<p className="auth-feedback error" role="alert">{message}</p>}<button className="button button-primary passport-submit" type="submit">{loading?'Connecting to CampusOS…':step<2?'Continue':'Create my account'} <CampusIcon name="arrow" size={18}/></button>{step>0&&<button type="button" className="signup-back" onClick={()=>setStep(value=>value-1)}>← Back a step</button>}</fieldset></form>}<p className="passport-form-foot"><CampusIcon name="lock" size={15}/> Your credentials stay out of the decorative preview.</p>
    </>}
  </section></main><footer className="passport-footer">A place to learn. A community to belong. <span>CampusOS / City University</span></footer></div>
}


