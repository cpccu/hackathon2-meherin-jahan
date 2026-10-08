import { useState } from 'react'
import UnsavedDialog from './UnsavedDialog.jsx'

export default function useDraftGuard() {
  const [pending, setPending] = useState(null)
  const guard = action => {
    if (document.querySelector('#workspace-content form[data-dirty="true"]')) setPending(() => action)
    else action()
  }
  const dialog = pending ? <UnsavedDialog onKeep={() => setPending(null)} onLeave={() => { pending(); setPending(null) }} /> : null
  return [guard, dialog]
}
