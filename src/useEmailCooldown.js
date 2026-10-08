import { useEffect, useState } from 'react'

export default function useEmailCooldown(initialWait=false) {
  const [until,setUntil]=useState(()=>initialWait?Date.now()+60000:0)
  const [remaining,setRemaining]=useState(initialWait?60:0)
  useEffect(()=>{
    const update=()=>setRemaining(Math.max(0,Math.ceil((until-Date.now())/1000)))
    update();if(!until)return
    const timer=setInterval(update,1000)
    return()=>clearInterval(timer)
  },[until])
  return {remaining,start:()=>{setRemaining(60);setUntil(Date.now()+60000)}}
}
