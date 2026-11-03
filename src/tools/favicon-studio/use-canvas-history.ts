import { useCallback, useState } from 'react'

interface CanvasState {
  imageData: ImageData
}

export function useCanvasHistory() {
  const [history, setHistory] = useState<CanvasState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const saveState = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      // Drop any redo future when a new action lands mid-history.
      const trimmed = history.slice(0, historyIndex + 1)
      setHistory([...trimmed, { imageData }])
      setHistoryIndex(trimmed.length)
    },
    [history, historyIndex],
  )

  const undo = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (historyIndex <= 0) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const next = historyIndex - 1
      ctx.putImageData(history[next].imageData, 0, 0)
      setHistoryIndex(next)
    },
    [history, historyIndex],
  )

  const redo = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (historyIndex >= history.length - 1) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const next = historyIndex + 1
      ctx.putImageData(history[next].imageData, 0, 0)
      setHistoryIndex(next)
    },
    [history, historyIndex],
  )

  const initializeHistory = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHistory([{ imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) }])
    setHistoryIndex(0)
  }, [])

  return {
    saveState,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    initializeHistory,
  }
}
