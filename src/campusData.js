import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

export function campusError(error) {
  if (error?.code === '23505') return 'This entry already exists. Refresh the list before trying again.'
  if (error?.code === '42501') return 'Your account cannot perform this action. Check your assigned role or contact an administrator.'
  if (error?.code === '23503') return 'A linked course or account is no longer available. Refresh and choose again.'
  if (/fetch|network/i.test(error?.message || '')) return 'Could not reach the server. Check your connection and try again.'
  if (['42P01','PGRST205','42883','PGRST202','PGRST204'].includes(error?.code)) return 'This feature needs database setup. Apply the missing CampusOS migrations in Supabase SQL Editor, including 004_questions_attendance_qr.sql and 005_transportation_notifications.sql for questions, QR entry, transportation and notifications.'
  return error?.message || 'Could not complete the request. Please try again.'
}
export async function readTable(table, order = 'created_at') {
  let query = supabase.from(table).select('*')
  if (order) query = query.order(order, { ascending: order !== 'created_at' })
  const { data, error } = await query
  if (error) throw error
  return data || []
}
export async function writeTable(table, values, id) {
  const query = id ? supabase.from(table).update(values).eq('id', id) : supabase.from(table).insert(values)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}
export function useCampusData(loader, dependencies = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    Promise.resolve().then(loader).then(result => { if (active) setData(result) }).catch(error => { if (active) setError(campusError(error)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // Callers provide stable primitive dependencies for their loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision])
  return { data, error, loading, reload }
}
export const memberName = user => user.user_metadata?.full_name || 'Campus member'
export const campusDate = value => new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Dhaka', dateStyle:'medium', timeStyle:'short' }).format(new Date(value))
export function dateParts(value) {
  const date = new Date(value)
  return {
    day: new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Dhaka', day:'2-digit' }).format(date),
    month: new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Dhaka', month:'short' }).format(date),
    date: new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Dhaka', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date).reduce((parts, part) => ({ ...parts, [part.type]:part.value }), {}),
  }
}
export function matchesSearch(values,query) {
  const text=values.join(' ').toLowerCase()
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).every(term=>text.includes(term))
}
export function announceSuccess(message) { window.dispatchEvent(new CustomEvent('campus:success', { detail:message })) }
export function safeLink(value) { try { const url = new URL(value); return ['https:','http:'].includes(url.protocol) ? url.href : null } catch { return null } }
