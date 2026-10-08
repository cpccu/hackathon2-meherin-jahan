import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))
root.render(<p role="status" style={{padding:32}}>Opening CampusOS…</p>)
import('./App.jsx').then(({default:App}) => {
  root.render(<StrictMode><App /></StrictMode>)
}).catch(() => {
  root.render(<main style={{maxWidth:640,margin:'10vh auto',padding:24}}><h1>CampusOS couldn’t start.</h1><p>Reload the page. If this continues, the administrator should check the Supabase URL and publishable key in the hosting environment and rebuild the site.</p><button onClick={()=>window.location.reload()}>Reload page</button></main>)
})
