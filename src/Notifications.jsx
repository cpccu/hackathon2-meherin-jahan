import { supabase } from './supabaseClient.js'
import { campusDate } from './campusData.js'
import { DataState, EmptyState, ModuleIntro, MutationButton } from './CampusUI.jsx'
import CampusIcon from './CampusIcon.jsx'

export default function Notifications({user,state,go}) {
  async function markRead(items) {
    if(!items.length)return
    const {error}=await supabase.from('notification_reads').upsert(items.map(item=>({user_id:user.id,notification_id:item.id})),{onConflict:'notification_id,user_id',ignoreDuplicates:true})
    if(error)throw error
  }
  return <div><ModuleIntro eyebrow="Campus updates" title="Notifications">New published notices and transportation alerts. Your latest 100 updates since joining CampusOS appear here.</ModuleIntro><DataState state={state}>{state.data&&<><div className="module-results"><h2>{state.unread} unread updates</h2><div><button className="section-link" onClick={state.reload}>Refresh</button>{state.unread>0&&<MutationButton className="section-link" action={()=>markRead(state.data.filter(item=>!item.read))} done={state.reload}>Mark all read</MutationButton>}</div></div>{!state.data.length&&<EmptyState icon="notifications" title="You’re up to date">New campus notices and bus service alerts will appear here.</EmptyState>}<div className="module-list">{state.data.map(item=><article key={item.id} className={`module-panel notification-card ${item.read?'':'notification-unread'}`}><CampusIcon name="notifications"/><div><span className="eyebrow">{item.read?'Read':'New update'}</span><h2>{item.title}</h2><small>{campusDate(item.created_at)}</small><div className="notification-actions"><button className="section-link" onClick={()=>go('notices')}>View campus notices</button>{!item.read&&<MutationButton className="section-link" action={()=>markRead([item])} done={state.reload}>Mark read</MutationButton>}</div></div></article>)}</div></>}</DataState></div>
}
