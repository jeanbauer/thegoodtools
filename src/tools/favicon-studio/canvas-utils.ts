export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

/** Validates any CSS color string (hex, rgb, named colors…). */
export function isValidColor(color: string): boolean {
  const el = document.createElement('div')
  el.style.color = color
  return el.style.color !== ''
}

/** Downloads the canvas as a 16×16 favicon.ico file. */
export function downloadCanvasAsFavicon(canvas: HTMLCanvasElement, filename = 'favicon.ico'): void {
  const temp = document.createElement('canvas')
  temp.width = 16
  temp.height = 16
  const ctx = temp.getContext('2d')
  if (!ctx) return
  ctx.drawImage(canvas, 0, 0, 16, 16)

  temp.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/x-icon')
}

/** Sets the canvas as the live browser-tab favicon. Returns the previous href. */
export function setCanvasAsFavicon(canvas: HTMLCanvasElement): string | null {
  const temp = document.createElement('canvas')
  temp.width = 16
  temp.height = 16
  const ctx = temp.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(canvas, 0, 0, 16, 16)

  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
  const previous = link?.href ?? null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    document.head.appendChild(link)
  }
  link.href = temp.toDataURL('image/png')
  return previous
}

/** Restores a previously captured favicon href. */
export function restoreFavicon(href: string | null): void {
  if (!href) return
  const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
  if (link) link.href = href
}
