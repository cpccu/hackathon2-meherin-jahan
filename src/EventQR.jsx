import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { announceSuccess, campusError } from './campusData.js'
import { ActionForm } from './CampusUI.jsx'
import { ticketCode, ticketPayload } from './eventTicket.js'

export function QRTicket({event,ticket}) {
  const [url,setUrl]=useState('')
  const [error,setError]=useState('')
  const [revision,setRevision]=useState(0)
  useEffect(()=>{
    let active=true
    setError('');setUrl('')
    import('qrcode').then(module=>module.default.toDataURL(ticketPayload(event.id,ticket.checkin_code),{width:320,margin:4,errorCorrectionLevel:'M',color:{dark:'#14231cff',light:'#ffffffff'}})).then(value=>{if(active)setUrl(value)}).catch(()=>{if(active)setError('Could not create the QR image. Use the ticket code or try again.')})
    return()=>{active=false}
  },[event.id,ticket.checkin_code,revision])
  return <div className="qr-ticket"><div>{url?<img src={url} width="240" height="240" alt={`Entry QR ticket for ${event.title}`}/>:<p role="status">{error||'Preparing your QR ticket…'}</p>}</div><p>Show this QR to the event organizer at the entrance. Keep it private: it admits one registration.</p>{url&&<a className="button button-secondary" href={url} download={`CampusOS-ticket-${ticket.id.slice(0,8)}.png`}>Download QR ticket</a>}{error&&<button className="button button-secondary" onClick={()=>setRevision(value=>value+1)}>Retry QR</button>}</div>
}

export function EventCheckIn({event,reload}) {
  const [running,setRunning]=useState(false)
  const [cameraError,setCameraError]=useState('')
  const [result,setResult]=useState(null)
  const [busy,setBusy]=useState(false)
  const video=useRef(null)
  const canvas=useRef(null)
  const mounted=useRef(true)
  const inFlight=useRef(false)
  const verifyRef=useRef(null)
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
  async function verify(value) {
    if(inFlight.current)throw new Error('Wait for the current ticket check to finish.')
    inFlight.current=true;setBusy(true);setResult(null);setRunning(false)
    try {
      const code=ticketCode(value,event.id)
      const {data,error}=await supabase.rpc('check_in_event_ticket',{target_event:event.id,ticket_code:code}).single()
      if(error)throw error
      if(!data)throw new Error('The server did not confirm admission. Refresh and try again.')
      if(mounted.current){setResult({ok:true,text:`Entry approved: ${data.attendee_name}. This ticket is now checked in.`});announceSuccess(`Checked in: ${data.attendee_name}`);reload()}
    }catch(error){if(mounted.current)setResult({ok:false,text:campusError(error)});throw error}
    finally{inFlight.current=false;if(mounted.current)setBusy(false)}
  }
  verifyRef.current=verify
  useEffect(()=>{
    if(!running)return
    let active=true,stream,frame,lastFrame=0
    const clean=()=>{active=false;cancelAnimationFrame(frame);stream?.getTracks().forEach(track=>track.stop());if(video.current)video.current.srcObject=null}
    async function start() {
      try {
        if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera scanning needs HTTPS or localhost. You can upload a QR image or paste the ticket code.')
        const module=await import('jsqr')
        if(!active)return
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false})
        if(!active){stream.getTracks().forEach(track=>track.stop());return}
        video.current.srcObject=stream
        await video.current.play()
        const decode=time=>{
          if(!active)return
          if(time-lastFrame>150&&video.current?.readyState>=2){
            lastFrame=time
            const width=Math.min(video.current.videoWidth,960)
            const height=Math.round(video.current.videoHeight*width/video.current.videoWidth)
            if(width&&height){canvas.current.width=width;canvas.current.height=height;const context=canvas.current.getContext('2d',{willReadFrequently:true});context.drawImage(video.current,0,0,width,height);const pixels=context.getImageData(0,0,width,height);const qr=module.default(pixels.data,width,height,{inversionAttempts:'attemptBoth'});if(qr){clean();setRunning(false);void verifyRef.current(qr.data).catch(()=>{});return}}
          }
          frame=requestAnimationFrame(decode)
        }
        frame=requestAnimationFrame(decode)
      }catch(error){const wasActive=active;clean();if(wasActive&&mounted.current){setRunning(false);setCameraError(error.name==='NotAllowedError'?'Camera access was denied. Allow it in your browser, or upload a QR image / paste the ticket code.':error.message||'Could not start the camera. Try an image or ticket code instead.')}}
    }
    void start()
    return clean
  },[running])
  async function scanImage(event) {
    const file=event.target.files?.[0];event.target.value=''
    if(!file)return
    setRunning(false);setCameraError('');setBusy(true)
    let bitmap
    try {
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('Choose a PNG, JPG or WebP ticket image up to 8 MB.')
      bitmap=await createImageBitmap(file)
      const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height))
      const image=document.createElement('canvas');image.width=Math.max(1,Math.round(bitmap.width*scale));image.height=Math.max(1,Math.round(bitmap.height*scale))
      const context=image.getContext('2d',{willReadFrequently:true});context.drawImage(bitmap,0,0,image.width,image.height)
      const pixels=context.getImageData(0,0,image.width,image.height)
      const module=await import('jsqr');const qr=module.default(pixels.data,image.width,image.height,{inversionAttempts:'attemptBoth'})
      if(!qr)throw new Error('No readable QR found. Choose a clear ticket image with the entire QR visible.')
      if(mounted.current)await verify(qr.data)
    }catch(error){if(mounted.current)setCameraError(campusError(error))}finally{bitmap?.close();if(mounted.current)setBusy(false)}
  }
  return <section className="event-scanner"><h3>QR entry check-in</h3><p className="module-muted">Scan the attendee’s registered ticket. Entry is approved only after the server verifies this event and records the first check-in.</p><div className="scanner-video" hidden={!running}><video ref={video} muted playsInline/><span>Keep the entire QR inside the camera view</span></div><canvas ref={canvas} hidden/>
    <div className="bulk-actions"><button type="button" className="button button-primary" disabled={busy} onClick={()=>{setCameraError('');setResult(null);setRunning(value=>!value)}}>{running?'Stop camera':'Scan a QR ticket'}</button><label className="button button-secondary scanner-upload">Read QR from image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={scanImage}/></label></div>
    <p className="module-muted">QR images are decoded on this device. Only the ticket identifier is sent for verification.</p>
    {busy&&<p role="status">Verifying registration…</p>}{cameraError&&<p role="alert" className="resource-error">{cameraError}</p>}{result&&<p role={result.ok?'status':'alert'} className={result.ok?'resource-success':'resource-error'}>{result.text}</p>}
    <details><summary>Use a ticket code instead</summary><ActionForm submit="Verify & admit" success="Ticket admitted." onSubmit={values=>verify(values.code)}><label className="full">Ticket code<input name="code" required placeholder="Paste the attendee’s ticket code"/></label></ActionForm></details>
  </section>
}
