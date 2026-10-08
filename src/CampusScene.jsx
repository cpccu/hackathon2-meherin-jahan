import { useId } from 'react'
import CampusIcon from './CampusIcon.jsx'
import usePointerDepth from './usePointerDepth.js'

const destinations=[['resources','The library','Resource Hub',22,39],['helpdesk','The conversation corner','Smart Helpdesk',74,39],['events','The gathering place','Clubs & Events',65,72],['lostfound','The helping hand','Student support',30,75]]

function Tree({x,y,scale=1}) {return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="15" rx="23" ry="9" fill="#234b3520"/><path d="M0 15V-26" stroke="#716145" strokeWidth="5"/><circle cy="-37" r="24" fill="#64856a"/><circle cx="-12" cy="-30" r="17" fill="#8da785"/><circle cx="9" cy="-42" r="16" fill="#456c50"/></g>}
function Building({x,y,width=120,height=100,color='#d9b892',roof='#852f40',label}) {return <g transform={`translate(${x} ${y})`}><path d={`M0 0 ${width} 0 ${width} ${height} 0 ${height}Z`} fill={color}/><path d={`M${width} 0 ${width+32} -18 ${width+32} ${height-18} ${width} ${height}Z`} fill="#b4ac91"/><path d={`M-10 0 ${width/2} -40 ${width+38} -20 ${width} 4Z`} fill={roof}/>{[18,49,80].map(cx=><g key={cx}><rect x={cx} y="22" width="17" height="23" rx="2" fill="#e8edce"/><rect x={cx} y="58" width="17" height="23" rx="2" fill="#365e53"/></g>)}<rect x={width/2-10} y={height-30} width="22" height="30" rx="2" fill="#355647"/><text x={width/2} y="17" textAnchor="middle" fill="#293e31" fontSize="8" fontWeight="700" letterSpacing="2">{label}</text></g>}

export default function CampusScene({active='resources',onChoose,compact=false}) {
  const id=useId().replaceAll(':','')
  const ref=usePointerDepth()
  return <div ref={ref} className={`campus-scene ${compact?'scene-compact':''}`} data-active={active}>
    <div className="scene-photo" aria-hidden="true"><img src="/images/campus/Aerial_View_of_a_Lush_University_Campus.png" alt="" width="1000" height="600"/></div>
    <svg className="scene-art" viewBox="0 0 1000 560" aria-hidden="true">
      <defs><linearGradient id={`${id}-earth`} x2="0" y2="1"><stop stopColor="#d9e2cb"/><stop offset="1" stopColor="#9ab591"/></linearGradient><linearGradient id={`${id}-path`}><stop stopColor="#fff3d7"/><stop offset="1" stopColor="#e4ceb0"/></linearGradient></defs>
      <ellipse cx="500" cy="432" rx="415" ry="96" fill="#2847320a"/>
      <path d="M92 360 385 165Q440 140 520 163L910 330Q945 355 900 391L600 520Q548 547 482 524L120 405Q73 389 92 360Z" fill={`url(#${id}-earth)`}/>
      <path d="m104 388 378 138q63 24 117-7l313-141v17L599 538q-56 28-119 6L105 408Z" fill="#7e9a77"/>
      <path d="M220 329Q358 295 484 353T791 326M493 356Q425 405 351 454M497 357Q608 411 674 447" fill="none" stroke={`url(#${id}-path)`} strokeWidth="31" strokeLinecap="round"/>
      <path d="m444 325 57-27 61 28-59 33Z" fill="#eee5ce"/><path d="m459 325 42-19 44 20-43 24Z" fill="#8daea0"/><ellipse cx="501" cy="322" rx="13" ry="5" fill="#f9f3df"/><path d="M501 322v-30" stroke="#f9f3df" strokeWidth="5"/>
      <g className="scene-building scene-resources"><Building x={194} y={222} width={140} height={111} label="LIBRARY"/><path d="m185 329-14 12 166 43 23-19Z" fill="#c5baa0"/><rect x="236" y="281" width="15" height="41" fill="#bba887"/></g>
      <g className="scene-building scene-helpdesk"><Building x={674} y={226} width={100} height={88} color="#e9d9b4" roof="#456452" label="HELPDESK"/><rect x="664" y="312" width="134" height="9" rx="3" fill="#c6bea5"/></g>
      <g className="scene-building scene-events"><path d="m576 385 95-63 96 67Z" fill="#852f40"/><path d="m602 384 69-44 68 45Z" fill="#b66163"/><path d="M600 385v63M741 385v63M669 350v89" stroke="#efe1bb" strokeWidth="8"/><path d="m582 447 90-38 85 39-83 39Z" fill="#d1bb94"/><path d="m608 441 66-24 50 22-54 27Z" fill="#f7e6c7"/><path d="m592 382 75 24 85-26" fill="none" stroke="#e4c28b" strokeWidth="3"/></g>
      <g className="scene-building scene-lostfound"><Building x={290} y={375} width={100} height={68} color="#f1dfbd" roof="#ad7c49" label="SUPPORT"/><path d="m312 396 8 8 17-19" fill="none" stroke="#852f40" strokeWidth="4"/></g>
      {[[156,321,1.1],[366,259,.9],[430,225,1.2],[577,228,.8],[818,321,1],[855,360,.8],[440,458,.85],[218,417,.8],[737,472,.75]].map(([x,y,scale])=><Tree key={x} x={x} y={y} scale={scale}/>)}
      <g className="scene-book"><path d="m431 394 26-9 22 13-27 9Z" fill="#852f40"/><path d="m432 399 21 8 24-10" fill="none" stroke="#f5e9ce" strokeWidth="4"/></g>
      <g><path d="M536 222v-77" stroke="#8c7560" strokeWidth="3"/><path d="M538 146h37v23l-37-9Z" fill="#852f40"/><text x="557" y="161" fontSize="9" textAnchor="middle" fill="white">CU</text></g>
      <path d="m481 499 26-12 21 9-24 13Z" fill="#852f40"/>
    </svg>
    {onChoose&&<div className="scene-destinations">{destinations.map(([key,title,label,x,y])=><button key={key} className={`scene-destination destination-${key}`} style={{left:`${x}%`,top:`${y}%`}} onClick={()=>onChoose(key)} onFocus={()=>{ref.current.dataset.active=key}} onMouseEnter={()=>{ref.current.dataset.active=key}} aria-label={`Explore ${label}: ${title}`}><span><CampusIcon name={key} size={19}/></span><strong>{label}</strong><small>{title}</small></button>)}</div>}
    {!compact&&<span className="scene-caption">An illustrated campus world · select a destination</span>}
  </div>
}
