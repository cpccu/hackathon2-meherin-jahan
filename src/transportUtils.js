export function dhakaDay(value=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value)
  const read=type=>parts.find(part=>part.type===type).value
  return `${read('year')}-${read('month')}-${read('day')}`
}
export function dhakaTime(value) {
  return value?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)):''
}
export function departureValues(values) {
  if(values.status==='cancelled'&&!values.notes.trim())throw new Error('Explain why this bus is unavailable. This reason will appear in the notice.')
  return {...values,scheduled_at:`${values.service_date}T${values.scheduled_at}:00+06:00`,expected_at:values.expected_at?`${values.service_date}T${values.expected_at}:00+06:00`:null}
}
