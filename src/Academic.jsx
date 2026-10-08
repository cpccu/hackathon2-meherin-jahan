import { useState } from 'react'
import BulkAttendance from './BulkAttendance.jsx'
import useDraftGuard from './useDraftGuard.jsx'
import { supabase } from './supabaseClient.js'
import { readTable, useCampusData, writeTable } from './campusData.js'
import { ActionForm, DataState, ModuleIntro } from './CampusUI.jsx'
import { ResourceRows } from './ResourceHub.jsx'
import { attendanceSummary } from './attendanceUtils.js'

export default function Academic({user,role,library,go}) {
  const state=useCampusData(async()=>({courses:await readTable('campus_courses','code'),enrollments:await readTable('course_enrollments',null),sessions:await readTable('class_sessions','class_date'),attendance:await readTable('attendance_records',null),members:role==='student'?[]:await readTable('member_profiles','full_name'),roles:role==='student'?[]:await readTable('account_roles',null)}),[user.id,role])
  const[selected,setSelected]=useState('')
  const[guard,draftDialog]=useDraftGuard()
  return <div className="academic-page">{draftDialog}<ModuleIntro eyebrow={role==='student'?'Your learning space':'Teaching workspace'} title="Courses & attendance">{role==='student'?'Your enrolled courses, class records and materials.':'Manage your assigned courses, enrollment and class attendance.'}</ModuleIntro><DataState state={state}>{state.data&&<>
    {role==='admin'&&<details className="module-panel"><summary>Create a course</summary><ActionForm submit="Create course" onDone={state.reload} onSubmit={values=>writeTable('campus_courses',values)}><label>Course code<input name="code" required/></label><label>Course title<input name="title" required/></label><label>Department<input name="department" required/></label><label>Semester<input name="semester" required placeholder="Fall 2026"/></label><label>Assigned teacher<select name="teacher_id" required><option value="">Choose a teacher account</option>{state.data.members.filter(member=>state.data.roles.some(r=>r.user_id===member.id&&['teacher','admin'].includes(r.role))).map(member=><option key={member.id} value={member.id}>{member.full_name} · {member.id.slice(0,8)}</option>)}</select></label><p>Assign a Teacher role in the Admin panel before choosing the teacher.</p></ActionForm></details>}
    <button className="section-link" onClick={state.reload}>Refresh courses & records</button>
    <div className="module-list">{state.data.courses.map(course=>{
      const records=state.data.attendance.filter(record=>record.course_id===course.id&&record.student_id===user.id)
      const summary=attendanceSummary(records)
      return <button className={`module-panel course-choice ${selected===course.id?'selected':''}`} onClick={()=>{if(selected!==course.id)guard(()=>setSelected(course.id))}} key={course.id}><span className="category-tag">{course.code} · {course.semester}</span><h2>{course.title}</h2><p>{course.department}</p>{role==='student'&&<p>{summary.total?`${summary.percentage}% attendance · ${summary.attended}/${summary.total} recorded classes`:'No attendance recorded yet.'}</p>}<span className="section-link">Open course →</span></button>
    })}</div>{!state.data.courses.length&&<p className="module-state">{role==='student'?'You have no course enrollments yet. An administrator or your teacher can enroll you.':'No courses assigned yet. Administrators can create courses and assign teachers.'}</p>}
    {state.data.courses.filter(c=>c.id===selected).map(course=><CourseWorkspace key={course.id} course={course} user={user} role={role} data={state.data} reload={state.reload} library={library} go={go}/>)}
  </>}</DataState></div>
}

function CourseWorkspace({course,user,role,data,reload,library,go}) {
  const [sessionId,setSessionId]=useState('')
  const[guard,draftDialog]=useDraftGuard()
  const enrollments=data.enrollments.filter(e=>e.course_id===course.id)
  const sessions=data.sessions.filter(s=>s.course_id===course.id)
  const ownRecords=data.attendance.filter(a=>a.course_id===course.id&&a.student_id===user.id)
  const manager=role==='admin'||(role==='teacher'&&course.teacher_id===user.id)
  return <section className="module-panel">{draftDialog}<h2>{course.code} · {course.title}</h2>
    {manager&&<>
      <details><summary>Enroll a student</summary><ActionForm submit="Enroll student" onDone={reload} onSubmit={async values=>{const{error}=await supabase.from('course_enrollments').insert({course_id:course.id,student_id:values.student_id});if(error)throw error}}><label>Student<select name="student_id" required><option value="">Choose student</option>{data.members.filter(m=>data.roles.some(r=>r.user_id===m.id&&r.role==='student')&&!enrollments.some(e=>e.student_id===m.id)).map(m=><option key={m.id} value={m.id}>{m.student_number||"ID not assigned"} · {m.full_name} · {m.department}</option>)}</select></label></ActionForm></details>
      <details><summary>Create a class session</summary><ActionForm submit="Create class" onDone={reload} onSubmit={values=>writeTable('class_sessions',{...values,course_id:course.id})}><label>Class date<input name="class_date" type="date" required/></label><label>Topic / class name<input name="topic" required/></label></ActionForm></details>
      <label className="helpdesk-search">Class to mark<select value={sessionId} onChange={e=>{const value=e.target.value;guard(()=>setSessionId(value))}}><option value="">Choose a class session</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.class_date} · {s.topic}</option>)}</select></label>
      {sessionId&&<BulkAttendance key={sessionId} course={course} sessionId={sessionId} enrollments={enrollments} members={data.members} attendance={data.attendance} reload={reload}/>}
    </>}
    {role==='student'&&<><h3>My attendance</h3><p className="module-muted">Present and Late count as attended. Excused classes are excluded. Unmarked classes do not affect the percentage.</p>{sessions.map(session=>{const record=ownRecords.find(a=>a.session_id===session.id);return <div className="attendance-record" key={session.id}><span>{session.class_date} · {session.topic}</span><strong>{record?.status||'Not recorded'}</strong></div>})}{!sessions.length&&<p>No class sessions recorded yet.</p>}</>}
    <div className="helpdesk-heading"><h3>Course resources</h3><button className="section-link" onClick={()=>go('upload')}>Upload a resource →</button></div><ResourceRows items={library.resources.filter(item=>item.course.trim().toLowerCase()===course.code.trim().toLowerCase()||item.course.toLowerCase().startsWith(`${course.code.toLowerCase()} ·`))} loading={library.loading} error={library.error} onRetry={library.reload} emptyMessage="No materials uploaded for this course yet."/>
    {manager&&<button className="button button-secondary" onClick={()=>go('notices')}>Publish a course notice</button>}
  </section>
}
