import { useEffect, useRef, useState } from 'react'

export default function useActivityHeader() {
  const header=useRef(null)
  const [idle,setIdle]=useState(false)
  useEffect(()=>{
    let timer
    const wake=()=>{setIdle(false);clearTimeout(timer);timer=setTimeout(()=>{
      if(!header.current?.contains(document.activeElement)&&!header.current?.matches(':hover'))setIdle(true)
    },3500)}
    const events=['scroll','pointermove','pointerdown','keydown','touchstart','focusin']
    events.forEach(event=>window.addEventListener(event,wake,{passive:true}));wake()
    return()=>{clearTimeout(timer);events.forEach(event=>window.removeEventListener(event,wake))}
  },[])
  return {header,idle,wake:()=>setIdle(false)}
}
