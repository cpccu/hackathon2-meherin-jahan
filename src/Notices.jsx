import { useState } from 'react'
import { supabase } from './supabaseClient.js'
import { campusDate, matchesSearch, memberName, readTable, safeLink, useCampusData, writeTable } from './campusData.js'
import { ActionForm, DataState, EmptyState, ModuleIntro, MutationButton } from './CampusUI.jsx'
import CampusIcon from './CampusIcon.jsx'
import { Attachment } from './Attachments.jsx'
import { withDocument } from './documentUpload.js'

const topics=['general','bus','closure','event','exam','rules','academic']
export default function Notices({ user, role }) {
  const state=useCampusData(async()=>({notices:await readTable('campus_notices'),courses:role==='student'?[]:await readTable('campus_courses','code')}),[user.id,role])
  const [query,setQuery]=useState('')
  const [topic,setTopic]=useState('')
  const visible=(state.data?.notices||[]).filter(item=>(!topic||item.category===topic)&&matchesSearch([item.title,item.body,item.category],query))
  return <div className="notices-page"><ModuleIntro eyebrow="A little more in the loop" title="Campus notices">The latest published updates, with the details you need. Campus-wide announcements and notices for your enrolled courses.</ModuleIntro><DataState state={state}>{state.data&&<>
    {role!=='student'&&<details className="module-panel compose-panel"><summary><span><CampusIcon name="notices"/> Publish a notice</span><span className="compose-plus">+</span></summary><p className="module-muted">Choose an audience, add the details and attach the original notice when available.</p><ActionForm submit="Publish notice" success="Your notice is published." onDone={state.reload} onSubmit={values=>withDocument(values,user.id,fields=>writeTable('campus_notices',{...fields,course_id:fields.course_id||null,source_url:fields.source_url||null,author_id:user.id,author_name:memberName(user)}))}>
      <label className="full">Title<input name="title" required maxLength={200} placeholder="A clear heading for your update"/></label><label className="full">Notice details<textarea name="body" required rows={5} placeholder="What should students know? Include any important dates or changes."/></label>
      <label>Topic<select name="category">{(role==='admin'?topics:['academic','exam']).map(value=><option key={value}>{value}</option>)}</select></label><label>Audience<select name="course_id" required={role==='teacher'}>{role==='admin'&&<option value="">Everyone on campus</option>}{state.data.courses.map(course=><option value={course.id} key={course.id}>{course.code} · {course.title}</option>)}</select></label>
      <label className="full">Official source link <small>Optional</small><input name="source_url" type="url" placeholder="https://…"/></label><label className="full">Original notice or routine <small>Optional · PDF, document or image · up to 20 MB</small><input type="file" name="attachment" accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.webp"/></label>
    </ActionForm></details>}
    <div className="module-filters filter-panel"><label className="wide-filter">Search notices<input type="search" placeholder="Find an announcement, course update or topic…" value={query} onChange={event=>setQuery(event.target.value)}/></label><label>Topic<select value={topic} onChange={event=>setTopic(event.target.value)}><option value="">All topics</option>{topics.map(value=><option key={value}>{value}</option>)}</select></label></div>
    <div className="module-results"><h2>{visible.length} {visible.length===1?'notice':'notices'}</h2><div>{(query.trim()||topic)&&<button className="section-link" onClick={()=>{setQuery('');setTopic('')}}>Clear filters</button>}<button className="section-link" onClick={state.reload}><CampusIcon name="refresh" size={16}/> Refresh notices</button></div></div>
    {!visible.length&&<EmptyState icon="notices" title={query.trim()||topic?'No notices match your search':'A space for the next update'}>{query.trim()||topic?'Try another keyword or choose all topics.':'Published campus and course updates will appear here.'}</EmptyState>}
    <div className="module-list">{visible.map(item=><article className="module-panel notice-card" key={item.id}><header><span className="notice-icon"><CampusIcon name={item.category==='academic'?'courses':item.category==='event'?'events':'notices'} size={22}/></span><span className="category-tag">{item.category}</span><small>{item.course_id?'Course notice':'Campus notice'}</small></header><h2>{item.title}</h2><p className="preserve-lines">{item.body}</p><Attachment path={item.attachment_path} name={item.attachment_name}/><div className="notice-card-footer"><small>{item.author_name}<br/>{campusDate(item.created_at)}</small>{safeLink(item.source_url)&&<a className="section-link" href={safeLink(item.source_url)} target="_blank" rel="noopener noreferrer">Official source ↗</a>}{(role==='admin'||(role==='teacher'&&item.author_id===user.id&&item.course_id))&&<MutationButton confirm="Remove this notice?" success="Notice removed." action={async()=>{const{error}=await supabase.from('campus_notices').delete().eq('id',item.id);if(error)throw error}} done={state.reload}>Remove notice</MutationButton>}</div></article>)}</div>
  </>}</DataState></div>
}
