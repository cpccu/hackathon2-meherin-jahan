// UI routing only. Migration 006 enforces the same boundary against signed JWTs.
export function isEmailVerifiedSession(session) {
  if(!session?.user?.email_confirmed_at||!session.access_token)return false
  try {
    const encoded=session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')
    const claims=JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length/4)*4,'=')))
    return Array.isArray(claims.amr)&&claims.amr.some(entry=>entry.method==='otp')
  }catch{return false}
}
