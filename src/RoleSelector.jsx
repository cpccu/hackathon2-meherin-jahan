import CampusIcon from './CampusIcon.jsx'

const options=[['student','Student','profile'],['teacher','Teacher','courses'],['admin','Admin','admin']]
export default function RoleSelector({value,onChange,disabled,login}) {
  return <div><span className="role-label" id="account-role-label">{login?'Log in as':'Create account as'}</span><div className="role-selector" style={{'--role-index':options.findIndex(([id])=>id===value)}} role="radiogroup" aria-labelledby="account-role-label" onKeyDown={event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)||disabled)return
    event.preventDefault()
    const current=options.findIndex(([id])=>id===value)
    const index=event.key==='Home'?0:event.key==='End'?2:(current+(['ArrowLeft','ArrowUp'].includes(event.key)?2:1))%3
    onChange(options[index][0]);event.currentTarget.querySelectorAll('button')[index]?.focus()
  }}>{options.map(([id,label,icon])=><button key={id} type="button" role="radio" aria-checked={value===id} tabIndex={value===id?0:-1} disabled={disabled} onClick={()=>onChange(id)}><CampusIcon name={icon} size={17}/>{label}</button>)}</div></div>
}
