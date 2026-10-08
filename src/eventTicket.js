const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function ticketPayload(eventId,code) {
  if(!uuid.test(eventId)||!uuid.test(code))throw new Error('Invalid ticket identifier.')
  return `campusos:ticket:v1:${eventId}:${code}`
}
export function ticketCode(value,eventId) {
  const raw=value.trim()
  if(uuid.test(raw))return raw.toLowerCase()
  const parts=raw.split(':')
  if(parts.length!==5||parts.slice(0,3).join(':')!=='campusos:ticket:v1'||!uuid.test(parts[3])||!uuid.test(parts[4]))throw new Error('This is not a valid CampusOS event ticket.')
  if(parts[3].toLowerCase()!==eventId.toLowerCase())throw new Error('This ticket belongs to a different event.')
  return parts[4].toLowerCase()
}
