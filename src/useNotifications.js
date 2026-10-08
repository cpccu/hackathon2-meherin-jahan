import { useEffect } from 'react'
import { supabase } from './supabaseClient.js'
import { useCampusData } from './campusData.js'
export default function useNotifications(user) {
  const state=useCampusData(async()=>{
    const {data:items,error}=await supabase.from('campus_notifications').select('*').gte('created_at',user.created_at).order('created_at',{ascending:false}).limit(100)
    if(error)throw error
    if(!items.length)return []
    const {data:reads,error:readError}=await supabase.from('notification_reads').select('notification_id').eq('user_id',user.id).in('notification_id',items.map(item=>item.id))
    if(readError)throw readError
    return items.map(item=>({...item,read:reads.some(read=>read.notification_id===item.id)}))
  },[user.id,user.created_at])
  const reload=state.reload
  useEffect(()=>{
    const refresh=()=>{if(!document.hidden)reload()}
    const timer=setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);window.addEventListener('campus:success',refresh)
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('campus:success',refresh)}
  },[reload])
  return {...state,unread:(state.data||[]).filter(item=>!item.read).length}
}
