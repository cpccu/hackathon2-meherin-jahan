import { useState } from 'react'
import { supabase } from './supabaseClient.js'
import { ActionForm } from './CampusUI.jsx'
import { matchesSearch } from './campusData.js'

export default function BulkAttendance({course,sessionId,enrollments,members,attendance,reload}) {
  const [selected,setSelected]=useState([])
  const [query,setQuery]=useState('')
  const [ids,setIds]=useState('')
  const [idError,setIdError]=useState('')
  const [status,setStatus]=useState('Present')
  const [absentOthers,setAbsentOthers]=useState(false)
  const roster=enrollments.map(enrollment=>({...enrollment,member:members.find(member=>member.id===enrollment.student_id)}))
  const visible=roster.filter(row=>matchesSearch([row.member?.full_name||'',row.member?.student_number||''],query))
  const toggle=id=>setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id])
  const markDirty=()=>{const form=document.getElementById(`attendance-${sessionId}`);if(form)form.dataset.dirty='true'}
  function addIds() {
    const requested=[...new Set(ids.toUpperCase().split(/[\s,;]+/).filter(Boolean))]
    const missing=requested.filter(number=>!roster.some(row=>row.member?.student_number===number))
    if(!requested.length){setIdError('Enter at least one university student ID.');return}
    if(missing.length){setIdError(`These IDs are not in this course roster: ${missing.join(', ')}. Ask an admin to assign IDs and check enrollment. No IDs were added.`);return}
    setSelected(current=>[...new Set([...current,...roster.filter(row=>requested.includes(row.member?.student_number)).map(row=>row.student_id)])])
    setIdError('');setIds('');markDirty()
  }
  return <div className="bulk-attendance"><ActionForm id={`attendance-${sessionId}`} reset={false} submit={`Save attendance for ${absentOthers?roster.length:selected.length} students`} success="Attendance saved for the selected class." onDone={()=>{setSelected([]);setAbsentOthers(false);reload()}} onSubmit={async()=>{
    if(!selected.length)throw new Error('Select at least one enrolled student before saving.')
    if(selected.some(id=>!roster.some(row=>row.student_id===id)))throw new Error('The course roster changed. Clear your selection and choose the students again.')
    const records=roster.filter(row=>selected.includes(row.student_id)||absentOthers).map(row=>({session_id:sessionId,course_id:course.id,student_id:row.student_id,status:selected.includes(row.student_id)?status:'Absent'}))
    const {error}=await supabase.from('attendance_records').upsert(records,{onConflict:'session_id,student_id'})
    if(error)throw error
  }}>
    <div className="full"><h3>Mark the class in one go</h3><p className="module-muted">Select students by university ID or tick the roster. One save records the whole selection. Unselected students keep their current record unless you choose to mark them absent.</p></div>
    <label className="full">Paste student IDs<textarea value={ids} onChange={event=>setIds(event.target.value)} rows={3} placeholder="Separate IDs with spaces, commas or new lines."/></label>
    <div className="full bulk-actions"><button type="button" className="button button-secondary" onClick={addIds}>Add these IDs to selection</button>{idError&&<p role="alert" className="resource-error">{idError}</p>}</div>
    <label>Attendance for selected students<select value={status} onChange={event=>setStatus(event.target.value)}>{['Present','Late','Excused','Absent'].map(value=><option key={value}>{value}</option>)}</select></label>
    <label>Find a student<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Student ID or name"/></label>
    <div className="full bulk-actions"><strong>{selected.length} of {roster.length} selected</strong><button className="section-link" type="button" onClick={()=>{setSelected(current=>[...new Set([...current,...visible.map(row=>row.student_id)])]);markDirty()}}>Select all shown</button><button type="button" className="section-link" onClick={()=>{setSelected([]);markDirty()}}>Clear selection</button></div>
    <div className="full attendance-roster">{visible.map(row=>{const record=attendance.find(record=>record.session_id===sessionId&&record.student_id===row.student_id);return <label className="roster-row" key={row.student_id}><input type="checkbox" checked={selected.includes(row.student_id)} onChange={()=>toggle(row.student_id)}/><span><strong>{row.member?.student_number||'Student ID not assigned'}</strong><small>{row.member?.full_name||'Student'}</small></span><span className="status-pill">{record?.status||'Not recorded'}</span></label>})}{!visible.length&&<p>{roster.length?'No students match the search.':'Enroll students before marking attendance.'}</p>}</div>
    <label className="full attendance-absent"><input type="checkbox" checked={absentOthers} onChange={event=>setAbsentOthers(event.target.checked)}/> Mark every unselected enrolled student Absent</label>
    {absentOthers&&<p className="full resource-error">Saving will replace attendance for all {roster.length} enrolled students in this class. {roster.length-selected.length} unselected students will be marked Absent.</p>}
  </ActionForm></div>
}
