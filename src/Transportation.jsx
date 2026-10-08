import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { campusDate, matchesSearch, readTable, useCampusData, writeTable } from './campusData.js'
import { ActionForm, DataState, EmptyState, ModuleIntro } from './CampusUI.jsx'
import CampusIcon from './CampusIcon.jsx'
import useDraftGuard from './useDraftGuard.jsx'
import { departureValues, dhakaDay, dhakaTime } from './transportUtils.js'

const statuses={scheduled:'Scheduled',delayed:'Delayed',boarding:'Boarding',departed:'Departed',cancelled:'Unavailable'}
export default function Transportation({role}) {
  const staff=role==='teacher'||role==='admin'
  const [date,setDate]=useState(dhakaDay)
  const today=useRef(dhakaDay())
  const [query,setQuery]=useState('')
  const [routeFilter,setRouteFilter]=useState('')
  const [editing,setEditing]=useState(null)
  const [editingRoute,setEditingRoute]=useState(null)
  const [guard,draftDialog]=useDraftGuard()
  const state=useCampusData(async()=>{
    const routes=await readTable('transport_routes','name')
    const {data,error}=await supabase.from('transport_departures').select('*').eq('service_date',date).order('scheduled_at')
    if(error)throw error
    return {routes,departures:data}
  },[date])
  const reload=state.reload
  useEffect(()=>{
    const refresh=()=>{if(document.hidden)return;const next=dhakaDay();if(next!==today.current){const previous=today.current;setDate(current=>current===previous?next:current);today.current=next}reload()}
    const timer=setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh)
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}
  },[reload])
  const routes=state.data?.routes||[]
  const visible=(state.data?.departures||[]).filter(item=>{
    const route=routes.find(route=>route.id===item.route_id)
    return item.service_date===date&&(!routeFilter||item.route_id===routeFilter)&&matchesSearch([item.bus_label,route?.name,route?.origin,route?.destination,route?.stops,item.notes],query)
  })
  return <div className="transport-page">{draftDialog}<ModuleIntro eyebrow="A clearer way to campus" title="Transportation">Daily bus services, routes and the latest departure updates published by campus staff. All times use Dhaka time.</ModuleIntro>
    <div className="transport-banner"><CampusIcon name="transportation" size={32}/><div><strong>Know before you go.</strong><p>Updates refresh every 30 seconds while this page is open. Times are staff-reported; this is not GPS tracking.</p></div></div>
    <DataState state={state}>{state.data&&<>
      {staff&&<section className="module-panel transport-management"><h2>Staff transportation desk</h2><p>Maintain routes and publish each day's bus runs. Unavailable buses require a reason; saving creates a campus notice and notification automatically. Delay updates and restored services also publish updates.</p>
        <details open={Boolean(editingRoute)}><summary>Manage bus routes</summary><ActionForm key={editingRoute?.id||'new-route'} submit={editingRoute?'Save route':'Add route'} success="Bus route saved." onDone={()=>{setEditingRoute(null);reload()}} onSubmit={values=>writeTable('transport_routes',{...values,active:values.active==='true'},editingRoute?.id)}>
          <label>Route name<input name="name" required maxLength={120} defaultValue={editingRoute?.name||''}/></label><label>Starting point<input name="origin" required maxLength={120} defaultValue={editingRoute?.origin||''}/></label><label>Destination<input name="destination" required maxLength={120} defaultValue={editingRoute?.destination||''}/></label><label>Route availability<select name="active" defaultValue={String(editingRoute?.active??true)}><option value="true">Active route</option><option value="false">Archived route</option></select></label><label className="full">Stops in order<textarea name="stops" maxLength={2000} rows={3} defaultValue={editingRoute?.stops||''} placeholder="One stop per line"/></label>
        </ActionForm>{editingRoute&&<button className="section-link" onClick={()=>guard(()=>setEditingRoute(null))}>Cancel route editing</button>}<div className="transport-route-list">{routes.map(route=><div key={route.id}><span><strong>{route.name}</strong><small>{route.origin} → {route.destination}{!route.active?' · archived':''}</small></span><button className="section-link" onClick={()=>guard(()=>setEditingRoute(route))}>Edit route</button></div>)}</div></details>
        <details open={Boolean(editing)}><summary>{editing?'Update bus departure':'Publish a daily departure'}</summary>{!routes.some(route=>route.active)&&!editing?<p>Add an active route first.</p>:<ActionForm key={editing?.id||`new-departure-${date}`} submit={editing?'Save departure update':'Publish departure'} success="Departure saved. Any service alert was published automatically." onDone={()=>{setEditing(null);reload()}} onSubmit={values=>writeTable('transport_departures',departureValues(values),editing?.id)}>
          <label>Bus name / number<input name="bus_label" required maxLength={80} defaultValue={editing?.bus_label||''}/></label><label>Route<select name="route_id" required defaultValue={editing?.route_id||''}><option value="" disabled>Choose a route</option>{routes.filter(route=>route.active||route.id===editing?.route_id).map(route=><option key={route.id} value={route.id}>{route.name}</option>)}</select></label><label>Service date<input type="date" name="service_date" required defaultValue={editing?.service_date||date}/></label><label>Scheduled departure<input type="time" name="scheduled_at" required defaultValue={dhakaTime(editing?.scheduled_at)}/></label><label>Updated departure <small>Optional estimate</small><input type="time" name="expected_at" defaultValue={dhakaTime(editing?.expected_at)}/></label><label>Current status<select name="status" defaultValue={editing?.status||'scheduled'}>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="full">Passenger information / reason<textarea name="notes" maxLength={2000} rows={3} defaultValue={editing?.notes||''} placeholder="Required when unavailable. Include the reason and any alternative service."/></label>
        </ActionForm>}{editing&&<button className="section-link" onClick={()=>guard(()=>setEditing(null))}>Cancel departure editing</button>}</details>
      </section>}
      <div className="module-filters filter-panel"><label>Service day<input type="date" required value={date} onChange={event=>{const next=event.target.value;if(next)guard(()=>{setDate(next);setEditing(null)})}}/></label><label>Route<select value={routeFilter} onChange={event=>setRouteFilter(event.target.value)}><option value="">All routes</option>{routes.map(route=><option key={route.id} value={route.id}>{route.name}</option>)}</select></label><label>Find your bus<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Bus, stop or destination"/></label></div>
      <div className="module-results"><h2>{date===dhakaDay()?'Today’s services':`Services · ${date}`}</h2><div><button className="section-link" onClick={()=>guard(()=>setDate(dhakaDay()))}>Today</button><button className="section-link" onClick={state.reload}>Refresh</button></div></div>
      {!visible.length&&<EmptyState icon="transportation" title="No departures published for this selection">Try another route or date. Staff must publish the actual daily services before they appear here.</EmptyState>}
      <div className="transport-departures">{visible.map(item=>{const route=routes.find(route=>route.id===item.route_id);return <article className={`module-panel departure-card departure-${item.status}`} key={item.id}><div className="departure-heading"><span className="notice-icon"><CampusIcon name="transportation" size={26}/></span><div><h2>{item.bus_label}</h2><p>{route?.name}</p></div><span className={`transport-status status-${item.status}`}>{statuses[item.status]}</span></div><div className="departure-route"><strong>{route?.origin}</strong><CampusIcon name="arrow"/><strong>{route?.destination}</strong></div>{route?.stops&&<details><summary>Route stops</summary><p className="preserve-lines">{route.stops}</p></details>}<div className="departure-times"><div><small>Scheduled</small><strong>{dhakaTime(item.scheduled_at)}</strong></div>{item.expected_at&&<div><small>Updated departure</small><strong>{dhakaTime(item.expected_at)}</strong></div>}<span>{item.status==='cancelled'?'Do not wait for this service':item.status==='departed'?'Service has departed':'Dhaka time'}</span></div>{item.notes&&<p className="preserve-lines">{item.notes}</p>}<footer><small>Staff updated · {campusDate(item.updated_at)}</small>{staff&&<button className="section-link" onClick={()=>guard(()=>{setEditing(item);window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})})}>Update service</button>}</footer></article>})}</div>
    </>}</DataState></div>
}
