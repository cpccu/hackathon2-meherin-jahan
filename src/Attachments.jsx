import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { campusError } from './campusData.js'
import CampusIcon from './CampusIcon.jsx'

export function Attachment({ path, name }) {
  if (!path) return null
  return <FileAttachment key={`${path}:${name}`} path={path} name={name || 'Campus document'} />
}

function FileAttachment({ path, name }) {
  const extension = path.split('.').pop().toLowerCase()
  const image = ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
  const pdf = extension === 'pdf'
  const [showPDF, setShowPDF] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(image)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!image && !showPDF) { setLoading(false); setFile(null); return }
    let active = true
    let objectUrl
    setLoading(true); setError(''); setFile(null)
    supabase.storage.from('campus-documents').download(path).then(({ data, error }) => {
      if (!active) return
      if (error) throw error
      const mime = pdf ? 'application/pdf' : ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' })[extension]
      const blob = new Blob([data], { type: mime })
      objectUrl = URL.createObjectURL(blob)
      setFile({ url: objectUrl, blob })
    }).catch(error => { if (active) setError(campusError(error)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [path, image, pdf, extension, showPDF, revision])

  async function download() {
    setDownloading(true); setError('')
    try {
      let blob = file?.blob
      if (!blob) {
        const { data, error } = await supabase.storage.from('campus-documents').download(path)
        if (error) throw error
        blob = data
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = name
      document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (error) { setError(campusError(error)) }
    finally { setDownloading(false) }
  }

  return <section className="notice-attachment" aria-label={`Attachment: ${name}`}>
    <div className="attachment-heading"><span className="attachment-file-icon"><CampusIcon name="resources" size={19} /></span><div><strong>{name}</strong><small>{image ? 'Image notice' : pdf ? 'PDF document' : 'Attached document'}</small></div></div>
    {loading && <p className="attachment-loading" role="status"><span className="loading-spinner" aria-hidden="true" /> Loading preview…</p>}
    {image && file && <a className="notice-image-link" href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size image: ${name}`}><img className="notice-image-preview" src={file.url} alt={name} onError={() => setError('The image could not be displayed. You can still download the attachment.')} /><span>Open full-size image ↗</span></a>}
    {pdf && showPDF && file && <div className="notice-pdf-preview"><iframe src={file.url} title={`PDF preview: ${name}`} /><p>Preview unavailable in your browser? Use “Open in new tab” or download the PDF.</p></div>}
    <div className="attachment-actions">
      {pdf && <button type="button" className="button button-secondary" aria-expanded={showPDF} onClick={() => { setShowPDF(value => !value); setError('') }}>{showPDF ? 'Hide PDF' : 'View PDF'}</button>}
      {file && pdf && showPDF && <a className="button button-secondary" href={file.url} target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>}
      <button type="button" className="button button-primary" disabled={downloading || loading} onClick={download}><CampusIcon name="arrow" size={17} />{downloading ? 'Downloading…' : 'Download'}</button>
    </div>
    {error && <div className="attachment-error" role="alert"><p>{error}</p>{(image || showPDF) && <button type="button" className="section-link" onClick={() => setRevision(value => value + 1)}>Retry preview</button>}</div>}
  </section>
}
