import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Tool } from './palettes'
import { floodFill } from './flood-fill'

interface FaviconCanvasProps {
  canvasSize: number
  currentTool: Tool
  color: string
  brushSize: number
  onDrawingEnd: () => void
}

export interface FaviconCanvasRef {
  getCanvas: () => HTMLCanvasElement | null
  resetCanvas: () => void
  loadImage: (file: File) => void
}

export const FaviconCanvas = forwardRef<FaviconCanvasRef, FaviconCanvasProps>(
  ({ canvasSize, currentTool, color, brushSize, onDrawingEnd }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawingRef = useRef(false)

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      resetCanvas: () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        onDrawingEnd()
      },
      loadImage: (file: File) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            const canvas = canvasRef.current
            const ctx = canvas?.getContext('2d')
            if (!canvas || !ctx) return
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
            const w = img.width * scale
            const h = img.height * scale
            ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
            onDrawingEnd()
          }
          img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
      },
    }))

    const coords = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      return {
        x: Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width),
        y: Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height),
        canvas,
      }
    }

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { x, y, canvas } = coords(e)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (currentTool === 'fill') {
        floodFill(canvas, x, y, color)
        onDrawingEnd()
        return
      }

      e.currentTarget.setPointerCapture(e.pointerId)
      ctx.beginPath()
      ctx.moveTo(x, y)
      isDrawingRef.current = true
    }

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || currentTool === 'fill') return
      const { x, y, canvas } = coords(e)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.lineTo(x, y)
      ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : color
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    const stopDrawing = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false
        onDrawingEnd()
      }
    }

    return (
      <div className="fav-canvas-frame">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          role="img"
          aria-label="Favicon drawing canvas"
          tabIndex={0}
        />
      </div>
    )
  },
)

FaviconCanvas.displayName = 'FaviconCanvas'
