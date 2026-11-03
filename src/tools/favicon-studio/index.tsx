import { useCallback, useEffect, useRef, useState } from 'react'
import { ToolPage } from '../../shared/ToolPage'
import { FaviconCanvas, type FaviconCanvasRef } from './FaviconCanvas'
import { useCanvasHistory } from './use-canvas-history'
import { COLOR_THEMES, type Tool } from './palettes'
import {
  downloadCanvasAsFavicon,
  isValidColor,
  restoreFavicon,
  setCanvasAsFavicon,
} from './canvas-utils'
import './favicon-studio.css'

const CANVAS_SIZE = 64

export default function FaviconStudio() {
  const canvasRef = useRef<FaviconCanvasRef>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const originalFavicon = useRef<string | null>(null)

  const [color, setColor] = useState('#ff4d00')
  const [hexInput, setHexInput] = useState('#ff4d00')
  const [tool, setTool] = useState<Tool>('pencil')
  const [brushSize, setBrushSize] = useState(5)
  const [themeName, setThemeName] = useState(COLOR_THEMES[0].name)
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [status, setStatus] = useState<string | null>(null)

  const { saveState, undo, redo, canUndo, canRedo, initializeHistory } = useCanvasHistory()

  const theme = COLOR_THEMES.find((t) => t.name === themeName) ?? COLOR_THEMES[0]

  // Init canvas + history on mount
  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (canvas) initializeHistory(canvas)
  }, [initializeHistory])

  // Restore the site's real favicon when leaving the tool
  useEffect(() => {
    return () => restoreFavicon(originalFavicon.current)
  }, [])

  // Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const canvas = canvasRef.current?.getCanvas()
      if (!canvas) return
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo(canvas)
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        redo(canvas)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  const flashStatus = (message: string) => {
    setStatus(message)
    setTimeout(() => setStatus(null), 3000)
  }

  const handleDrawingEnd = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (canvas) saveState(canvas)
  }, [saveState])

  const pickColor = (next: string) => {
    setColor(next)
    setHexInput(next)
    setRecentColors((current) => [next, ...current.filter((c) => c !== next)].slice(0, 8))
    if (tool !== 'pencil') setTool('pencil')
  }

  const handleUpload = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    canvasRef.current?.loadImage(file)
    flashStatus('Image shrunk onto the canvas — tweak away!')
  }

  const handlePreview = () => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    const previous = setCanvasAsFavicon(canvas)
    if (!originalFavicon.current) originalFavicon.current = previous
    flashStatus('Look at your browser tab 👀')
  }

  const handleDownload = () => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    downloadCanvasAsFavicon(canvas)
    flashStatus('Downloading favicon.ico ↓')
  }

  return (
    <ToolPage
      name="Favicon Studio"
      tagline="Draw a pixel-art favicon — or shrink an image — and preview it live in this tab. No uploads, just pixels."
    >
      <div className="fav-studio">
        <div className="fav-history">
          <button
            className="fav-tool-btn"
            onClick={() => {
              const canvas = canvasRef.current?.getCanvas()
              if (canvas) undo(canvas)
            }}
            disabled={!canUndo}
            aria-label="Undo (Cmd+Z)"
            title="Undo (⌘Z)"
          >
            <UndoIcon />
          </button>
          <button
            className="fav-tool-btn"
            onClick={() => {
              const canvas = canvasRef.current?.getCanvas()
              if (canvas) redo(canvas)
            }}
            disabled={!canRedo}
            aria-label="Redo (Cmd+Shift+Z)"
            title="Redo (⌘⇧Z)"
          >
            <RedoIcon />
          </button>
        </div>

        <div className="fav-editor">
          <div className="fav-tools" role="toolbar" aria-label="Drawing tools">
            <button
              className="fav-tool-btn"
              aria-pressed={tool === 'pencil'}
              onClick={() => setTool('pencil')}
              aria-label="Pencil"
              title="Pencil"
            >
              <PencilIcon />
            </button>
            <button
              className="fav-tool-btn"
              aria-pressed={tool === 'fill'}
              onClick={() => setTool('fill')}
              aria-label="Fill"
              title="Fill"
            >
              <BucketIcon />
            </button>
            <button
              className="fav-tool-btn"
              aria-pressed={tool === 'eraser'}
              onClick={() => setTool('eraser')}
              aria-label="Eraser"
              title="Eraser"
            >
              <EraserIcon />
            </button>
            <button
              className="fav-tool-btn"
              onClick={() => {
                canvasRef.current?.resetCanvas()
                flashStatus('Fresh canvas!')
              }}
              aria-label="Clear canvas"
              title="Clear canvas"
            >
              <ResetIcon />
            </button>
          </div>

          <FaviconCanvas
            ref={canvasRef}
            canvasSize={CANVAS_SIZE}
            currentTool={tool}
            color={color}
            brushSize={brushSize}
            onDrawingEnd={handleDrawingEnd}
          />

          <div className="fav-actions" role="toolbar" aria-label="File actions">
            <button
              className="fav-tool-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload an image"
              title="Upload an image"
            >
              <UploadIcon />
            </button>
            <button
              className="fav-tool-btn"
              onClick={handlePreview}
              aria-label="Preview in browser tab"
              title="Preview in browser tab"
            >
              <EyeIcon />
            </button>
            <button
              className="fav-tool-btn"
              onClick={handleDownload}
              aria-label="Download favicon.ico"
              title="Download favicon.ico"
            >
              <DownloadIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleUpload(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="fav-controls">
          <div className="fav-theme-row">
            <label htmlFor="fav-theme">Palette</label>
            <select
              id="fav-theme"
              className="fav-select"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
            >
              {COLOR_THEMES.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fav-color-row">
            <input
              type="color"
              className="fav-color-input"
              value={isValidColor(color) && /^#[0-9a-f]{6}$/i.test(color) ? color : '#000000'}
              onChange={(e) => pickColor(e.target.value)}
              aria-label="Pick a color"
            />
            <input
              type="text"
              className="fav-hex-input"
              value={hexInput}
              placeholder="#ff4d00"
              aria-label="Color value (hex, rgb, or name)"
              onChange={(e) => {
                setHexInput(e.target.value)
                if (isValidColor(e.target.value)) {
                  setColor(e.target.value)
                  setRecentColors((current) =>
                    [e.target.value, ...current.filter((c) => c !== e.target.value)].slice(0, 8),
                  )
                }
              }}
              onBlur={() => {
                if (!isValidColor(hexInput)) setHexInput(color)
              }}
            />
            <div className="fav-swatches" role="group" aria-label="Palette colors">
              {theme.colors.map((c) => (
                <button
                  key={c}
                  className="fav-swatch"
                  style={{ background: c }}
                  aria-pressed={color.toLowerCase() === c.toLowerCase()}
                  aria-label={`Use color ${c}`}
                  title={c}
                  onClick={() => pickColor(c)}
                />
              ))}
            </div>
          </div>

          {recentColors.length > 0 && (
            <div>
              <p className="fav-recent-label">Recent colors</p>
              <div className="fav-swatches" role="group" aria-label="Recently used colors">
                {recentColors.map((c) => (
                  <button
                    key={c}
                    className="fav-swatch small"
                    style={{ background: c }}
                    aria-label={`Use recent color ${c}`}
                    title={c}
                    onClick={() => pickColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="fav-brush">
            <label htmlFor="fav-brush-size">Brush</label>
            <input
              id="fav-brush-size"
              className="fav-range"
              type="range"
              min={1}
              max={10}
              step={1}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <output>{brushSize}px</output>
          </div>

          <p className="fav-status" aria-live="polite">
            {status}
          </p>
        </div>
      </div>
    </ToolPage>
  )
}

/* ---- inline icons (stroke style, inherit currentColor) ---- */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function BucketIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 2 8.5 8.5a2.12 2.12 0 0 1 0 3L12 22l-8.5-8.5a2 2 0 0 1 0-3Z" />
      <path d="M12 2 5.5 8.5" />
    </svg>
  )
}

function EraserIcon() {
  return (
    <svg {...iconProps}>
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
