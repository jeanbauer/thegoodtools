import { useCallback, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { ToolPage } from '../../shared/ToolPage'
import { SegmentedControl } from '../../shared/SegmentedControl'
import './pdf-split-merge.css'

type Mode = 'split' | 'merge'

interface PdfItem {
  id: number
  file: File
  name: string
  pages: number
  size: string
}

const MAX_SIZE = 100 * 1024 * 1024

function isPdf(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export default function PdfSplitMerge() {
  const [mode, setMode] = useState<Mode>('split')

  const [splitDoc, setSplitDoc] = useState<PdfItem | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [mergeFiles, setMergeFiles] = useState<PdfItem[]>([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  const readPdf = async (file: File): Promise<PdfItem> => {
    const doc = await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
    })
    return {
      id: nextId.current++,
      file,
      name: file.name,
      pages: doc.getPageCount(),
      size: formatSize(file.size),
    }
  }

  const addFiles = useCallback(
    async (incoming: FileList | File[] | null) => {
      if (!incoming?.length) return
      setError(null)
      setSuccess(null)
      for (const file of Array.from(incoming)) {
        if (!isPdf(file)) {
          setError(`"${file.name}" isn't a PDF — skipping that one.`)
          continue
        }
        if (file.size > MAX_SIZE) {
          setError(`"${file.name}" is over 100 MB — a bit too chunky for the browser.`)
          continue
        }
        try {
          const item = await readPdf(file)
          if (mode === 'split') {
            setSplitDoc(item)
            setSelected(new Set(Array.from({ length: item.pages }, (_, i) => i + 1)))
          } else {
            setMergeFiles((current) => [...current, item])
          }
        } catch {
          setError(`Couldn't read "${file.name}" — it may be encrypted or damaged.`)
        }
      }
    },
    [mode],
  )

  /* ---------- split ---------- */

  const togglePage = (page: number) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(page)) next.delete(page)
      else next.add(page)
      return next
    })
    setSuccess(null)
  }

  const splitDownload = async () => {
    if (!splitDoc || selected.size === 0 || busy) return
    setBusy(true)
    setError(null)
    try {
      const source = await PDFDocument.load(await splitDoc.file.arrayBuffer())
      const out = await PDFDocument.create()
      const indices = [...selected].sort((a, b) => a - b).map((p) => p - 1)
      const pages = await out.copyPages(source, indices)
      pages.forEach((page) => out.addPage(page))
      const bytes = await out.save()
      downloadBytes(bytes, `${splitDoc.name.replace(/\.pdf$/i, '')}-split.pdf`)
      setSuccess('Done! Your new PDF is downloading ↓')
    } catch {
      setError('Something went sideways while splitting. Mind trying again?')
    } finally {
      setBusy(false)
    }
  }

  /* ---------- merge ---------- */

  const moveFile = (index: number, direction: -1 | 1) => {
    setMergeFiles((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setSuccess(null)
  }

  const removeFile = (id: number) => {
    setMergeFiles((current) => current.filter((item) => item.id !== id))
    setSuccess(null)
  }

  const mergeDownload = async () => {
    if (busy) return
    if (mergeFiles.length < 2) {
      setError('Add at least two PDFs — merging one is just… the same file.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const out = await PDFDocument.create()
      for (const item of mergeFiles) {
        const source = await PDFDocument.load(await item.file.arrayBuffer())
        const pages = await out.copyPages(source, source.getPageIndices())
        pages.forEach((page) => out.addPage(page))
      }
      const bytes = await out.save()
      downloadBytes(bytes, 'thegoodtools-merged.pdf')
      setSuccess('Done! Your merged PDF is downloading ↓')
    } catch {
      setError('Something went sideways while merging. Mind trying again?')
    } finally {
      setBusy(false)
    }
  }

  const totalMergePages = mergeFiles.reduce((sum, item) => sum + item.pages, 0)
  const showDropzone = mode === 'merge' || !splitDoc

  return (
    <ToolPage
      name="PDF Split & Merge"
      tagline="Take the pages you need out of a PDF, or squish several into one. All in your browser — files never leave your device."
    >
      <div className="pdf-layout">
        <div className="pdf-mode">
          <SegmentedControl
            label="What are we doing?"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'split', label: 'Split one PDF' },
              { value: 'merge', label: 'Merge PDFs' },
            ]}
          />
        </div>

        {showDropzone && (
          <button
            type="button"
            className={`dropzone pdf-dropzone${isDragging ? ' dropzone-active' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              void addFiles(e.dataTransfer.files)
            }}
          >
            <UploadIcon />
            <span className="big">
              {mode === 'split' ? 'Drop your PDF here' : 'Drop your PDFs here'}
            </span>
            <span>
              or <strong>click to browse</strong> — everything stays on your device
            </span>
            <small>PDF only · up to 100 MB{mode === 'merge' ? ' each' : ''}</small>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={mode === 'merge'}
          hidden
          onChange={(e) => {
            void addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {mode === 'split' && splitDoc && (
          <div className="pdf-panel">
            <div className="pdf-panel-head">
              <div className="pdf-file-meta">
                <span className="pdf-file-icon">
                  <FileIcon />
                </span>
                <div>
                  <p className="pdf-file-name">{splitDoc.name}</p>
                  <p className="pdf-file-sub">
                    {splitDoc.pages} {splitDoc.pages === 1 ? 'page' : 'pages'} · {splitDoc.size}
                  </p>
                </div>
              </div>
              <button
                className="pdf-link-btn"
                onClick={() => {
                  setSplitDoc(null)
                  setSelected(new Set())
                  setSuccess(null)
                  setError(null)
                }}
              >
                Replace file
              </button>
            </div>

            <div>
              <div className="pdf-pages-head">
                <h2>Keep which pages?</h2>
                <span className="pdf-count-pill">
                  {selected.size} of {splitDoc.pages}
                </span>
              </div>
              <div className="pdf-pages-actions">
                <button
                  className="pdf-link-btn"
                  onClick={() =>
                    setSelected(new Set(Array.from({ length: splitDoc.pages }, (_, i) => i + 1)))
                  }
                >
                  All
                </button>
                <button className="pdf-link-btn" onClick={() => setSelected(new Set())}>
                  None
                </button>
              </div>
            </div>

            <div className="pdf-pages">
              {Array.from({ length: splitDoc.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className="pdf-page"
                  aria-pressed={selected.has(page)}
                  aria-label={`Page ${page}`}
                  onClick={() => togglePage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <div className="pdf-actions">
              <button
                className="tbtn tbtn-primary"
                disabled={selected.size === 0 || busy}
                onClick={() => void splitDownload()}
              >
                {busy ? 'Working on it…' : 'Split it'}
              </button>
            </div>
          </div>
        )}

        {mode === 'merge' && mergeFiles.length > 0 && (
          <div className="pdf-panel">
            <div className="pdf-panel-head">
              <div className="pdf-file-meta">
                <div>
                  <p className="pdf-file-name">
                    {mergeFiles.length} {mergeFiles.length === 1 ? 'file' : 'files'} ·{' '}
                    {totalMergePages} pages total
                  </p>
                  <p className="pdf-file-sub">They'll be merged top to bottom, in this order.</p>
                </div>
              </div>
              <button className="pdf-link-btn" onClick={() => inputRef.current?.click()}>
                + Add more
              </button>
            </div>

            <ol className="pdf-merge-list">
              {mergeFiles.map((item, index) => (
                <li key={item.id} className="pdf-merge-row">
                  <span className="pdf-merge-order">{index + 1}</span>
                  <div className="pdf-merge-meta">
                    <p className="pdf-file-name">{item.name}</p>
                    <p className="pdf-file-sub">
                      {item.pages} {item.pages === 1 ? 'page' : 'pages'} · {item.size}
                    </p>
                  </div>
                  <div className="pdf-merge-controls">
                    <button
                      className="pdf-icon-btn"
                      aria-label={`Move ${item.name} up`}
                      disabled={index === 0}
                      onClick={() => moveFile(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className="pdf-icon-btn"
                      aria-label={`Move ${item.name} down`}
                      disabled={index === mergeFiles.length - 1}
                      onClick={() => moveFile(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="pdf-icon-btn"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeFile(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <div className="pdf-actions">
              <button
                className="tbtn tbtn-primary"
                disabled={busy}
                onClick={() => void mergeDownload()}
              >
                {busy ? 'Working on it…' : "Merge 'em"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {success && <p className="pdf-success">{success}</p>}
        <p className="pdf-local-note">
          Your files are processed in your browser and never uploaded anywhere.
        </p>
      </div>
    </ToolPage>
  )
}

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}
