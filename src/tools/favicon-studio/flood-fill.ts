import { hexToRgb } from './canvas-utils'

/** Classic 4-way flood fill on a canvas. */
export function floodFill(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  fillColor: string,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const fillRgb = hexToRgb(fillColor)
  if (!fillRgb) return

  const pixelIndex = (x: number, y: number) => (y * canvas.width + x) * 4
  const startIndex = pixelIndex(startX, startY)
  const targetR = data[startIndex]
  const targetG = data[startIndex + 1]
  const targetB = data[startIndex + 2]

  if (targetR === fillRgb.r && targetG === fillRgb.g && targetB === fillRgb.b) return

  const stack = [{ x: startX, y: startY }]
  const checked = new Set<string>()

  while (stack.length > 0) {
    const { x, y } = stack.pop()!
    const key = `${x},${y}`
    if (checked.has(key) || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue
    checked.add(key)

    const i = pixelIndex(x, y)
    if (data[i] === targetR && data[i + 1] === targetG && data[i + 2] === targetB) {
      data[i] = fillRgb.r
      data[i + 1] = fillRgb.g
      data[i + 2] = fillRgb.b
      data[i + 3] = 255
      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
