import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { normalizeResource, resourceErrorMessage } from './resourceUtils.js'

export default function useResources(userId) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    async function load() {
      try {
        const { data, error: queryError } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
        if (queryError) throw queryError
        if (active) setResources(data.map(normalizeResource))
      } catch (loadError) {
        if (active) { setResources([]); setError(resourceErrorMessage(loadError)) }
      } finally {
        if (active) setLoading(false)
      }
    }
    if (userId) load()
    else { setResources([]); setLoading(false) }
    return () => { active = false }
  }, [userId, revision])

  return { resources, loading, error, reload: () => setRevision(current => current + 1) }
}

export function readSavedResources(userId) {
  try {
    const values = JSON.parse(localStorage.getItem(`campusos:saved:${userId}`) || '[]')
    return Array.isArray(values) ? values.filter(id => typeof id === 'string') : []
  } catch { return [] }
}
