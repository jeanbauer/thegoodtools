import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { ToolPage } from '../../shared/ToolPage'
import './qr-code.css'

const CANVAS_SIZE = 1024

type Spacing = 'none' | 'sm' | 'md' | 'lg'
type CornerStyle = 'rounded' | 'squared'

const SPACING_MAP: Record<Spacing, number> = {
  none: 0,
  sm: 0.06,
  md: 0.14,
  lg: 0.24,
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export default function QrCodeTool() {
  const [link, setLink] = useState('')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Logo controls
  const [logoScale, setLogoScale] = useState(0.24)
  // How the image fills its square frame: 1 = whole image fits (contain),
  // higher zooms in and crops, lower shrinks within the frame.
  const [imageScale, setImageScale] = useState(1)
  const [spacing, setSpacing] = useState<Spacing>('md')
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>('rounded')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = useCallback((file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError("That doesn't look like an image — try a PNG, JPG or SVG.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const generate = useCallback(async () => {
    const url = normalizeUrl(link)
    if (!url) {
      setError('Pop in a link first — the QR needs somewhere to point.')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return

    setError(null)

    try {
      // High error correction so the centered logo doesn't break scannability.
      await QRCode.toCanvas(canvas, url, {
        errorCorrectionLevel: 'H',
        width: CANVAS_SIZE,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })

      // The qrcode library writes inline width/height styles onto the canvas;
      // reset them so the preview scales responsively.
      canvas.style.width = '100%'
      canvas.style.height = '100%'

      if (imageSrc) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('Could not load image'))
            img.src = imageSrc
          })

          // The image is sized by logoScale; the white plate adds spacing around it.
          const imgSize = CANVAS_SIZE * logoScale
          const pad = imgSize * SPACING_MAP[spacing]
          const plateSize = imgSize + pad * 2
          const center = CANVAS_SIZE / 2

          const plateRadius = cornerStyle === 'rounded' ? plateSize * 0.18 : 0
          const imgRadius = cornerStyle === 'rounded' ? imgSize * 0.14 : 0

          // White backing plate (skipped when spacing is none — image sits flush).
          if (pad > 0) {
            ctx.fillStyle = '#ffffff'
            roundedRectPath(
              ctx,
              center - plateSize / 2,
              center - plateSize / 2,
              plateSize,
              plateSize,
              plateRadius,
            )
            ctx.fill()
          }

          const drawX = center - imgSize / 2
          const drawY = center - imgSize / 2

          ctx.save()
          roundedRectPath(ctx, drawX, drawY, imgSize, imgSize, imgRadius)
          ctx.clip()

          // White fill under the image keeps letterboxed areas scannable.
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(drawX, drawY, imgSize, imgSize)

          const containRatio = Math.min(imgSize / img.width, imgSize / img.height)
          const drawW = img.width * containRatio * imageScale
          const drawH = img.height * containRatio * imageScale
          ctx.drawImage(img, center - drawW / 2, center - drawH / 2, drawW, drawH)
          ctx.restore()
        }
      }

      setGenerated(true)
    } catch {
      setError('Hmm, that link broke the machine. Mind checking it?')
    }
  }, [link, imageSrc, logoScale, imageScale, spacing, cornerStyle])

  // Once generated, keep the preview in sync as the user tweaks anything.
  useEffect(() => {
    if (generated) {
      void generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoScale, imageScale, spacing, cornerStyle, imageSrc, link])

  const download = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'thegoodtools-qr.png'
    a.click()
  }, [])

  return (
    <ToolPage
      name="QR Code"
      tagline="Point it at a link, drop your logo in the middle, done. Everything happens in your browser."
    >
      <div className="qr-layout">
        <div className="qr-controls">
          <div className="qr-field">
            <label htmlFor="qr-link">Destination link</label>
            <input
              id="qr-link"
              className="qr-input"
              type="url"
              inputMode="url"
              placeholder="yoursite.com/page"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="qr-hint">Scanning the code opens this URL.</p>
          </div>

          <div className="qr-field">
            <span className="label">Center image (optional)</span>
            <button
              type="button"
              className={`qr-dropzone${isDragging ? ' qr-drop-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFile(e.dataTransfer.files?.[0])
              }}
            >
              {imageSrc ? (
                <>
                  <img src={imageSrc} alt="Selected center logo" />
                  <span className="strong">Looking good — click or drop to swap it</span>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <span>
                    <span className="strong">Click to upload</span> or drag &amp; drop
                  </span>
                  <small>PNG, JPG, or SVG — it never leaves your device</small>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {imageSrc ? (
            <div className="qr-panel">
              <div className="qr-field">
                <div className="qr-slider-head">
                  <label htmlFor="qr-logo-size">Image size</label>
                  <output>{Math.round(logoScale * 100)}%</output>
                </div>
                <input
                  id="qr-logo-size"
                  className="qr-range"
                  type="range"
                  min={10}
                  max={35}
                  value={Math.round(logoScale * 100)}
                  onChange={(e) => setLogoScale(Number(e.target.value) / 100)}
                />
              </div>

              <div className="qr-field">
                <div className="qr-slider-head">
                  <label htmlFor="qr-image-scale">Image scale</label>
                  <output>{Math.round(imageScale * 100)}%</output>
                </div>
                <input
                  id="qr-image-scale"
                  className="qr-range"
                  type="range"
                  min={50}
                  max={250}
                  value={Math.round(imageScale * 100)}
                  onChange={(e) => setImageScale(Number(e.target.value) / 100)}
                />
                <p className="qr-hint">
                  Zoom the image inside its frame. 100% shows the whole thing; higher crops in.
                </p>
              </div>

              <SegmentedControl
                label="Spacing to QR"
                value={spacing}
                onChange={(v) => setSpacing(v as Spacing)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'sm', label: 'Small' },
                  { value: 'md', label: 'Medium' },
                  { value: 'lg', label: 'Large' },
                ]}
              />

              <SegmentedControl
                label="Corners"
                value={cornerStyle}
                onChange={(v) => setCornerStyle(v as CornerStyle)}
                options={[
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'squared', label: 'Squared' },
                ]}
              />
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="qr-error">
              {error}
            </p>
          ) : null}

          <div className="qr-actions">
            <button className="qr-btn qr-btn-primary" onClick={() => void generate()}>
              Make my QR
            </button>
            <button
              className="qr-btn qr-btn-secondary"
              onClick={download}
              disabled={!generated}
            >
              Download PNG
            </button>
          </div>
        </div>

        <div className="qr-preview">
          <div className="qr-preview-frame">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{ display: generated ? 'block' : 'none' }}
            />
            {!generated ? (
              <div className="qr-preview-empty">
                <QrPlaceholderIcon />
                <span>Your QR code will pop up here.</span>
              </div>
            ) : null}
          </div>
          {generated ? <p className="qr-success">Done! Your QR is ready ↓</p> : null}
          <p className="qr-hint">Downloads as a crisp 1024×1024 PNG — print-ready.</p>
        </div>
      </div>
    </ToolPage>
  )
}

function SegmentedControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="qr-field">
      <span className="label">{label}</span>
      <div className="qr-segmented">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
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

function QrPlaceholderIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <line x1="14" y1="14" x2="14" y2="21" />
      <line x1="21" y1="14" x2="21" y2="21" />
      <line x1="17.5" y1="14" x2="17.5" y2="17.5" />
      <line x1="14" y1="17.5" x2="21" y2="17.5" />
    </svg>
  )
}
