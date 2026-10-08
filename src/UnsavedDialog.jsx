import { useEffect, useRef } from 'react'
import CampusIcon from './CampusIcon.jsx'

export default function UnsavedDialog({onKeep,onLeave}) {
  const dialog=useRef(null)
  useEffect(()=>{
    const previous=document.activeElement
    const element=dialog.current
    element.showModal()
    return()=>{element.close();previous?.focus()}
  },[])
  return <dialog ref={dialog} className="unsaved-dialog" onCancel={event=>{event.preventDefault();onKeep()}} aria-labelledby="unsaved-title" aria-describedby="unsaved-description"><span className="empty-icon"><CampusIcon name="edit" size={26}/></span><h2 id="unsaved-title">Keep your work?</h2><p id="unsaved-description">You have unsaved changes on this page. Stay to finish them, or leave and discard the changes.</p><div><button className="button button-primary" onClick={onKeep}>Keep editing</button><button className="button button-secondary" onClick={onLeave}>Discard & leave</button></div></dialog>
}
