import { useId, useState } from 'react'

export default function PasswordField({label='Password',name='password',autoComplete='current-password',value,onChange}) {
  const [visible,setVisible]=useState(false)
  const id=useId()
  return <div className="passport-field"><label htmlFor={id}>{label}</label><span className="password-control"><input id={id} name={name} type={visible?'text':'password'} autoComplete={autoComplete} required minLength={6} placeholder={label} value={value} onChange={onChange}/><button type="button" aria-label={`${visible?'Hide':'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(current=>!current)}>{visible?'Hide':'Show'}</button></span></div>
}
