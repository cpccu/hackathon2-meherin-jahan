import { useRef, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { DEPARTMENTS, RESOURCE_BUCKET, RESOURCE_CATEGORIES, filterResources, resourceErrorMessage, resourceFileType, validateResourceFile } from './resourceUtils.js'
import { readTable, useCampusData } from './campusData.js'
import CampusIcon from './CampusIcon.jsx'
import { EmptyState } from './CampusUI.jsx'

function FileIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h4" /></svg>
}

function FileActions({ item }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function download() {
    setBusy('download'); setError('')
    try {
      const { data, error: downloadError } = await supabase.storage.from(RESOURCE_BUCKET).download(item.storage_path)
      if (downloadError) throw downloadError
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url; link.download = item.file_name
      document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (downloadError) { setError(resourceErrorMessage(downloadError)) }
    finally { setBusy('') }
  }

  async function view() {
    const preview = window.open('about:blank', '_blank')
    if (!preview) { setError('Your browser blocked the preview. Allow pop-ups or use Download.'); return }
    preview.opener = null
    preview.document.body.textContent = 'Loading your PDF…'
    setBusy('view'); setError('')
    try {
      const { data, error: previewError } = await supabase.storage.from(RESOURCE_BUCKET).createSignedUrl(item.storage_path, 60)
      if (previewError) throw previewError
      preview.location.replace(data.signedUrl)
    } catch (previewError) { preview.close(); setError(resourceErrorMessage(previewError)) }
    finally { setBusy('') }
  }

  return <div className="resource-file-actions">
    <div>{item.type === 'PDF' && <button type="button" className="download-button" disabled={Boolean(busy)} onClick={view}>{busy === 'view' ? 'Opening…' : 'View PDF'}</button>}
      <button type="button" className="download-button" disabled={Boolean(busy)} onClick={download}>{busy === 'download' ? 'Downloading…' : 'Download'}</button></div>
    {error && <p className="resource-error" role="alert">{error}</p>}
  </div>
}

function LibraryStatus({ loading, error, onRetry, empty, message }) {
  if (loading) return <div className="empty-state" role="status">Loading resources…</div>
  if (error) return <div className="empty-state" role="alert"><p>{error}</p><button className="button button-secondary" onClick={onRetry}>Try again</button></div>
  if (empty) return <EmptyState icon="resources" title={message || 'No resources yet.'}>Adjust your filters or upload a useful resource to your campus library.</EmptyState>
  return null
}

export function ResourceRows({ items, loading, error, onRetry, emptyMessage = 'No resources yet.', saved, toggleSaved }) {
  if (loading || error || !items.length) return <LibraryStatus loading={loading} error={error} onRetry={onRetry} empty={!items.length} message={emptyMessage} />
  return <div className="resource-list">{items.map(item => <article className="resource-row live-resource-row" key={item.id}>
    <span className={`file-badge ${item.color}`}><FileIcon /></span>
    <div className="resource-name"><strong>{item.title}</strong><span>{item.course} · {item.category} · {item.visibility}</span><span>{item.uploader} · {item.date}</span></div>
    {toggleSaved && <button className={`bookmark ${saved.includes(item.id) ? 'saved' : ''}`} aria-label={saved.includes(item.id) ? 'Unsave resource' : 'Save resource'} aria-pressed={saved.includes(item.id)} onClick={() => toggleSaved(item.id)}>{saved.includes(item.id) ? '★' : '☆'}</button>}
    <FileActions item={item} />
  </article>)}</div>
}

export function ResourceHub({ library, go, user, saved, toggleSaved, notice, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [department, setDepartment] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [scope, setScope] = useState('all')
  const [courseFilter, setCourseFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const courses = [...new Set(library.resources.map(item => item.course))].sort()
  const tags = [...new Set(library.resources.flatMap(item => item.tags))].sort()
  const visible = filterResources(library.resources, { query, department, category, tag, scope, userId: user.id, saved }).filter(item => !courseFilter || item.course === courseFilter).sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'oldest' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at))
  const hasFilters = Boolean(query.trim() || department || category || tag || courseFilter || scope !== 'all')

  function clearFilters() { setQuery(''); setDepartment(''); setCategory(''); setTag(''); setScope('all'); setCourseFilter('') }

  return <div className="resources-page">
    <div className="page-intro"><div className="eyebrow">Knowledge, shared</div><h1>The Resource <em>Hub.</em></h1><p>Find notes, question papers and notices shared by your campus community.</p></div>
    {notice && <p className="resource-success" role="status">{notice}</p>}
    <div className="resource-toolbar">
      <div className="search-box"><CampusIcon name="search" size={20}/><input type="search" aria-label="Search resources" placeholder="Search title, course, subject or tags…" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="filter-row live-filter-row">
        <select aria-label="Department" value={department} onChange={event => setDepartment(event.target.value)}><option value="">All departments</option>{DEPARTMENTS.map(item => <option key={item}>{item}</option>)}</select>
        <select aria-label="Course" value={courseFilter} onChange={event => setCourseFilter(event.target.value)}><option value="">All courses</option>{courses.map(item => <option key={item}>{item}</option>)}</select>
        <select aria-label="Resource category" value={category} onChange={event => setCategory(event.target.value)}><option value="">All types</option>{RESOURCE_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select>
        <select aria-label="Resource tag" value={tag} onChange={event => setTag(event.target.value)}><option value="">All tags</option>{tags.map(item => <option key={item}>{item}</option>)}</select>
        <select aria-label="Resource collection" value={scope} onChange={event => setScope(event.target.value)}><option value="all">All accessible resources</option><option value="public">Public resources</option><option value="mine">My uploads</option><option value="private">My private resources</option><option value="saved">Saved on this browser</option></select>
        <button className="button button-primary" onClick={() => go('upload')}><CampusIcon name="upload" size={18}/> Upload resource</button>
      </div>
    </div>
    <div className="module-results"><h2>{library.loading ? 'Your library' : `${visible.length} ${visible.length === 1 ? 'resource' : 'resources'}`}</h2><div><label className="sort-control">Sort<select value={sort} onChange={event=>setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label>{hasFilters&&<button className="section-link" onClick={clearFilters}>Clear filters</button>}<button className="section-link" onClick={library.reload}><CampusIcon name="refresh" size={16}/> Refresh</button></div></div>
    {hasFilters && <div className="active-filters"><span>Filtered by</span>{[query.trim()&&`Search: ${query.trim()}`,department,courseFilter,category,tag&&`Tag: ${tag}`,scope!=='all'&&({public:'Public resources',mine:'My uploads',private:'My private resources',saved:'Saved resources'})[scope]].filter(Boolean).map(value=><span className="tag-chip" key={value}>{value}</span>)}</div>}
    <LibraryStatus loading={library.loading} error={library.error} onRetry={library.reload} empty={!visible.length} message={library.resources.length ? 'No resources match your search or filters.' : 'No resources have been uploaded yet.'} />
    {!library.loading && !library.error && !visible.length && library.resources.length > 0 && <button className="button button-secondary" onClick={clearFilters}>Clear filters</button>}
    {!library.loading && !library.error && <div className="resource-card-grid">{visible.map(item => <article className="resource-card live-resource-card" key={item.id}>
      <div className="resource-card-top"><span className={`file-badge large ${item.color}`}><FileIcon /></span><button className={`bookmark ${saved.includes(item.id) ? 'saved' : ''}`} aria-label={saved.includes(item.id) ? 'Unsave resource' : 'Save resource'} aria-pressed={saved.includes(item.id)} onClick={() => toggleSaved(item.id)}>{saved.includes(item.id) ? '★' : '☆'}</button></div>
      <span className="category-tag">{item.category}</span><h3>{item.title}</h3><p>{item.course}{item.subject && ` · ${item.subject}`}</p>
      {item.description && <p className="resource-description">{item.description}</p>}
      <p className="resource-department">{item.department}</p><div className="tag-row">{item.tags.map(value => <span className="tag-chip" key={value}>{value}</span>)}</div>
      <div className="card-footer"><div className="uploader"><span>{item.uploader}<small>{item.visibility} · {item.date}</small><small>{item.type} · {(item.file_size / 1024 / 1024).toFixed(2)} MB</small></span></div><FileActions item={item} /></div>
    </article>)}</div>}
  </div>
}

export function UploadResource({ user, go, onUploaded, role = 'student' }) {
  const courseState = useCampusData(() => readTable('campus_courses', 'code'), [user.id])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState(user.user_metadata?.department || DEPARTMENTS[0])
  const [course, setCourse] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Notes')
  const [tagInput, setTagInput] = useState('')
  const [visibility, setVisibility] = useState('Public')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)

  function chooseFile(selected) {
    if (busy) return
    const fileError = validateResourceFile(selected)
    setError(fileError); setFile(fileError ? null : selected)
  }

  async function publish(event) {
    event.preventDefault()
    const form = event.currentTarget
    if (busy) return
    setError('')
    const fileError = validateResourceFile(file)
    if (fileError) { setError(fileError); return }
    if (!title.trim() || !course.trim()) { setError('Enter a resource title and course.'); return }
    const tags = [...new Set(tagInput.split(',').map(value => value.trim().toLowerCase()).filter(Boolean))]
    if (tags.length > 20) { setError('Use no more than 20 tags.'); return }
    const type = resourceFileType(file)
    const path = `${user.id}/${crypto.randomUUID()}.${type.extension}`
    let fileUploaded = false
    setBusy(true)
    try {
      const { error: uploadError } = await supabase.storage.from(RESOURCE_BUCKET).upload(path, file, { contentType: type.mime, upsert: false })
      if (uploadError) throw uploadError
      fileUploaded = true
      const { data, error: saveError } = await supabase.from('resources').insert({
        title: title.trim(), description: description.trim(), department, course: course.trim(), subject: subject.trim(), category, tags, visibility,
        storage_path: path, file_name: file.name, file_type: type.label, file_size: file.size, uploaded_by: user.id,
        uploader_name: user.user_metadata?.full_name?.trim() || user.email.split('@')[0],
      }).select().single()
      if (saveError) throw saveError
      form.dataset.dirty = 'false'
      onUploaded(data)
    } catch (uploadError) {
      let cleanupFailed = false
      if (fileUploaded) {
        try {
          const { error: cleanupError } = await supabase.storage.from(RESOURCE_BUCKET).remove([path])
          cleanupFailed = Boolean(cleanupError)
        } catch { cleanupFailed = true }
      }
      setError(`${resourceErrorMessage(uploadError)}${cleanupFailed ? ' The unlisted file could not be cleaned up. Please contact the site administrator.' : ''}`)
    } finally { setBusy(false) }
  }

  return <div className="upload-page">
    <div className="page-intro"><div className="eyebrow">Share what you know</div><h1>Upload a <em>resource.</em></h1><p>Save your study materials or share them with other students.</p></div>
    <div className="upload-layout"><form className="upload-form" onChange={event=>{event.currentTarget.dataset.dirty='true'}} onSubmit={publish}>
      <fieldset className="resource-fieldset" disabled={busy}>
        <div className="form-section"><h3>Resource details</h3><div className="form-grid">
          <label className="full">Title<input required maxLength={160} placeholder="e.g. Data Structures Final Question 2026" value={title} onChange={event => setTitle(event.target.value)} /></label>
          <label className="full">Description<textarea rows="3" maxLength={5000} placeholder="What will students find in this file?" value={description} onChange={event => setDescription(event.target.value)} /></label>
          <label>Department<select required value={department} onChange={event => setDepartment(event.target.value)}>{DEPARTMENTS.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Course code<input required list="resource-course-codes" placeholder="e.g. CSE 2201" value={course} onChange={event => setCourse(event.target.value)} /><datalist id="resource-course-codes">{courseState.data?.map(item => <option key={item.id} value={item.code}>{item.title}</option>)}</datalist><small>{role === 'teacher' ? 'Choose your assigned course code so materials appear in that course.' : 'Use the exact course code to link materials to a course.'}</small></label>
          <label>Subject<input placeholder="e.g. Sorting algorithms" value={subject} onChange={event => setSubject(event.target.value)} /></label>
          <label>Resource type<select value={category} onChange={event => setCategory(event.target.value)}>{RESOURCE_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="full">Tags, separated by commas<input placeholder="e.g. final, algorithms, lecture-note" value={tagInput} onChange={event => setTagInput(event.target.value)} /></label>
        </div></div>
        <div className="form-section"><h3>Visibility</h3><div className="visibility-options">
          {['Public', 'Private'].map(value => <label key={value} className={visibility === value ? 'selected' : ''}><input type="radio" name="visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} /><span><strong>{value}</strong><small>{value === 'Public' ? 'Shared with signed-in CampusOS students.' : 'Accessible only to your account.'}</small></span></label>)}
        </div></div>
        <div className="form-section"><h3>Add your file</h3>
          <button type="button" className={`drop-zone live-drop-zone ${dragging ? 'dragging' : ''}`} onClick={() => fileInput.current.click()} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]) }}>
            <span className="drop-icon"><FileIcon /></span><strong>{file ? file.name : 'Drop your file here, or click to browse'}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace` : 'PDF, DOCX or PPTX · Maximum 20 MB'}</small>
          </button>
          <input ref={fileInput} className="resource-file-input" type="file" aria-label="Choose resource file" accept=".pdf,.docx,.pptx" onChange={event => { if (event.target.files[0]) chooseFile(event.target.files[0]); event.target.value = '' }} />
        </div>
        {error && <p className="resource-error" role="alert">{error}</p>}
        <div className="upload-actions"><button type="button" className="text-button" onClick={() => go('resources')}>Cancel</button><button type="submit" className="button button-primary">{busy ? 'Uploading and saving…' : 'Publish resource →'}</button></div>
      </fieldset>
      {busy && <p role="status" className="resource-upload-status">Uploading and saving your resource. Please keep this page open.</p>}
    </form><aside className="upload-aside"><div className="tip-card"><span className="tip-spark">✦</span><h3>Make it easy to find.</h3><p>Use a clear course name and relevant tags. Public files help other students, while private files stay accessible only to you.</p></div></aside></div>
  </div>
}
