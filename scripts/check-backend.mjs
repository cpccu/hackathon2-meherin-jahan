// Read-only anonymous access check. Never prints environment values or records.
import { readFileSync } from 'node:fs'
const env={...process.env}
try {
  for (const line of readFileSync(new URL('../.env.local',import.meta.url),'utf8').split(/\r?\n/)) {
    const match=line.match(/^\s*(VITE_SUPABASE_(?:URL|ANON_KEY))\s*=\s*(.*?)\s*$/)
    if(match && !env[match[1]])env[match[1]]=match[2].replace(/^['"]|['"]$/g,'')
  }
}catch { /* Hosting environment may supply these values directly. */ }
if(!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY){console.error('Missing local Supabase configuration.');process.exit(1)}
const base=new URL(env.VITE_SUPABASE_URL)
if(base.pathname!=='/' || base.protocol!=='https:'){console.error('Use the HTTPS Supabase base URL without a path.');process.exit(1)}
let failed=false
for(const table of ['resources','helpdesk','campus_courses','attendance_records','campus_notices','campus_events','event_registrations','lost_found_posts','campus_complaints']){
  try{
    const response=await fetch(new URL(`/rest/v1/${table}?select=*&limit=0`,base),{headers:{apikey:env.VITE_SUPABASE_ANON_KEY},signal:AbortSignal.timeout(15000)})
    const body=await response.json().catch(()=>({}))
    const protectedTable=[401,403].includes(response.status) && body.code==='42501'
    console.log(`${table}: anonymous access ${protectedTable?'denied':'unexpected response'} (HTTP ${response.status}, code ${body.code||'unavailable'})`)
    if(!protectedTable)failed=true
  }catch {console.error(`${table}: connection failed`);failed=true}
}
console.log('This does not verify signed-in role permissions or write/upload workflows.')
process.exitCode=failed?1:0
