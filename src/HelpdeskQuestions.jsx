import { useEffect, useState } from 'react'
import { campusDate, matchesSearch, readTable, useCampusData, writeTable } from './campusData.js'
import { ActionForm, DataState, EmptyState } from './CampusUI.jsx'
import CampusIcon from './CampusIcon.jsx'

export default function HelpdeskQuestions({ user, role }) {
  const state=useCampusData(async()=>({questions:await readTable('helpdesk_questions'),replies:await readTable('helpdesk_replies'),members:await readTable('member_profiles','full_name')}),[user.id,role])
  const [query,setQuery]=useState('')
  const [pendingOnly,setPendingOnly]=useState(false)
  const reload=state.reload
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==='visible')reload()}
    const timer=setInterval(refresh,30000)
    document.addEventListener('visibilitychange',refresh)
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}
  },[reload])
  const threads=(state.data?.questions||[]).map(question=>{
    const replies=(state.data?.replies||[]).filter(reply=>reply.question_id===question.id).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))
    const answered=replies.length>0&&replies.at(-1).author_role!=='student'
    const author=state.data?.members.find(member=>member.id===question.asked_by)
    return {...question,replies,answered,author}
  }).filter(question=>(!pendingOnly||!question.answered)&&matchesSearch([question.title,question.body,...question.replies.map(reply=>reply.body)],query))
  return <section className="question-desk"><div className="section-title"><div><span className="eyebrow">A conversation with campus staff</span><h2>{role==='student'?'Ask the Helpdesk':'Student questions'}</h2></div></div>
    <div className="privacy-note"><CampusIcon name="lock"/><p>Questions are visible to their student author, teachers and administrators. Replies appear here automatically while this page is open.</p></div>
    {role==='student'&&<details className="module-panel compose-panel"><summary>Ask a question <span>+</span></summary><ActionForm submit="Send question" success="Question sent. Staff replies will appear in your conversation below." onDone={state.reload} onSubmit={values=>writeTable('helpdesk_questions',values)}><label className="full">Question title<input name="title" required maxLength={200} placeholder="What would you like to know?"/></label><label>Topic<select name="category">{['general','academic','exam','bus','rules'].map(topic=><option key={topic}>{topic}</option>)}</select></label><label className="full">Details<textarea name="body" required maxLength={5000} rows={4} placeholder="Include the details staff need to help you."/></label></ActionForm></details>}
    <div className="module-filters filter-panel"><label className="wide-filter">Search conversations<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Question or reply…"/></label><label className="filter-checks"><input type="checkbox" checked={pendingOnly} onChange={event=>setPendingOnly(event.target.checked)}/> Waiting for staff</label><button className="button button-secondary" onClick={state.reload}>Refresh conversations</button></div>
    <DataState state={state}>{state.data&&<>{!threads.length&&<EmptyState icon="helpdesk" title="No conversations here yet">{query||pendingOnly?'Try changing your filters.':role==='student'?'Ask your first question above.':'Student questions will appear here when submitted.'}</EmptyState>}
      <div className="question-threads">{threads.map(question=><article className="module-panel question-thread" key={question.id}><div className="helpdesk-heading"><span className="category-tag">{question.category}</span><span className={`status-pill ${question.answered?'status-open':''}`}>{question.answered?'Staff replied':'Waiting for staff'}</span></div><h3>{question.title}</h3><p className="preserve-lines">{question.body}</p><small className="module-muted">{question.author?.full_name||"Student"}{question.author?.student_number?` · ${question.author.student_number}`:""} · Asked {campusDate(question.created_at)} · #{question.id.slice(0,8)}</small>
        <ol className="thread-replies">{question.replies.map(reply=><li key={reply.id} className={reply.author_role==='student'?'student-reply':'staff-reply'}><strong>{reply.author_name} <span className="category-tag">{reply.author_role}</span></strong><p className="preserve-lines">{reply.body}</p><small>{campusDate(reply.created_at)}</small></li>)}</ol>
        <details><summary>{role==='student'?'Add a follow-up':'Reply to this student'}</summary><ActionForm submit="Send reply" success="Reply sent." onDone={state.reload} onSubmit={values=>writeTable('helpdesk_replies',{question_id:question.id,body:values.body})}><label className="full">Your reply<textarea name="body" required rows={3} maxLength={5000}/></label></ActionForm></details>
      </article>)}</div></>}</DataState>
  </section>
}
