import { useEffect, useRef } from 'react'

export default function usePointerDepth() {
  const ref=useRef(null)
  useEffect(()=>{
    const element=ref.current
    if(navigator.connection?.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency<4))return
    const capable=window.matchMedia('(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame=0,x=0,y=0
    const paint=()=>{frame=0;element.style.setProperty('--depth-x',`${x}px`);element.style.setProperty('--depth-y',`${y}px`)}
    const move=event=>{if(!capable.matches)return;const bounds=element.getBoundingClientRect();x=(event.clientX-bounds.left-bounds.width/2)/bounds.width*10;y=(event.clientY-bounds.top-bounds.height/2)/bounds.height*8;if(!frame)frame=requestAnimationFrame(paint)}
    const reset=()=>{x=0;y=0;if(!frame)frame=requestAnimationFrame(paint)}
    element.addEventListener('pointermove',move,{passive:true});element.addEventListener('pointerleave',reset);capable.addEventListener('change',reset)
    return()=>{cancelAnimationFrame(frame);element.removeEventListener('pointermove',move);element.removeEventListener('pointerleave',reset);capable.removeEventListener('change',reset)}
  },[])
  return ref
}
