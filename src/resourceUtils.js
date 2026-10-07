export const RESOURCE_BUCKET = 'campus-resources'
export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const RESOURCE_CATEGORIES = ['Notes', 'Question Paper', 'Lab Manual', 'Notice']
export const DEPARTMENTS = ['Computer Science & Engineering (CSE)', 'Textile Engineering (TE)', 'Electrical & Electronic Engineering (EEE)', 'Civil Engineering (CE)', 'Pharmacy', 'Mechanical Engineering (ME)', 'English', 'Law', 'Business Administration (DBA/BBA)', 'Agriculture', 'General Education (GED)']

const fileTypes = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export function validateResourceFile(file) {
  if (!file) return 'Choose a file before publishing.'
  const extension = file.name.split('.').pop().toLowerCase()
  if (!fileTypes[extension]) return 'Please choose a PDF, DOCX, or PPTX file.'
  if (file.size === 0) return 'The selected file is empty. Choose another file.'
  if (file.size > MAX_FILE_BYTES) return 'The file must be 20 MB or smaller.'
  return ''
}

export function resourceFileType(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  return { extension, mime: fileTypes[extension], label: extension.toUpperCase() }
}

export function normalizeResource(row) {
  const date = new Date(row.created_at)
  return {
    ...row,
    tags: row.tags || [],
    type: row.file_type,
    uploader: row.uploader_name || 'Student',
    date: Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric' }).format(date),
    color: ({ Notes: 'blue', 'Question Paper': 'red', 'Lab Manual': 'green', Notice: 'orange' })[row.category] || 'blue',
  }
}

export function filterResources(resources, { query = '', department = '', category = '', tag = '', scope = 'all', userId, saved = [] }) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return resources.filter(item => {
    if (department && item.department !== department) return false
    if (category && item.category !== category) return false
    if (tag && !item.tags.includes(tag)) return false
    if (scope === 'mine' && item.uploaded_by !== userId) return false
    if (scope === 'public' && item.visibility !== 'Public') return false
    if (scope === 'private' && (item.visibility !== 'Private' || item.uploaded_by !== userId)) return false
    if (scope === 'saved' && !saved.includes(item.id)) return false
    const text = [item.title, item.description, item.department, item.course, item.subject, item.category, item.uploader, ...item.tags].join(' ').toLocaleLowerCase()
    return terms.every(term => text.includes(term))
  })
}

export function resourceErrorMessage(error) {
  if (error?.code === 'PGRST205' || error?.code === '42P01') return 'The resource library is awaiting setup. Please ask the site administrator to complete it.'
  if (error?.code === '42501') return 'Your account does not have permission for this action. Try logging in again.'
  return error?.message || 'Something went wrong. Please try again.'
}
