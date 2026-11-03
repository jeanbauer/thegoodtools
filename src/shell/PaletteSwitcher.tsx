import { useEffect, useState } from 'react'

/**
 * TEMPORARY brand-evaluation aid: switch between candidate palettes live.
 * Delete this component (and the data-palette overrides in theme.css) once
 * the palette decision is final.
 */
const palettes = [
  { id: 'orange', label: 'Safety Orange', color: '#ff4d00' },
  { id: 'coral', label: 'Coral Punch', color: '#f04438' },
  { id: 'amber', label: 'Sunny Amber', color: '#ffb020' },
  { id: 'spearmint', label: 'Spearmint', color: '#0e9f6e' },
  { id: 'lilac', label: 'Lilac', color: '#7c3aed' },
  { id: 'ocean', label: 'Ocean', color: '#2563eb' },
  { id: 'mono', label: 'Mono Ink', color: '#1b1812' },
] as const

type PaletteId = (typeof palettes)[number]['id']

export function PaletteSwitcher() {
  const [palette, setPalette] = useState<PaletteId>(
    () => (localStorage.getItem('tgt-palette') as PaletteId) || 'orange',
  )

  useEffect(() => {
    if (palette === 'orange') {
      delete document.documentElement.dataset.palette
    } else {
      document.documentElement.dataset.palette = palette
    }
    localStorage.setItem('tgt-palette', palette)
  }, [palette])

  return (
    <div className="palette-switcher" role="group" aria-label="Preview color palettes">
      {palettes.map((p) => (
        <button
          key={p.id}
          type="button"
          className="palette-dot"
          style={{ background: p.color, color: p.color }}
          title={p.label}
          aria-label={`Preview ${p.label} palette`}
          aria-pressed={palette === p.id}
          onClick={() => setPalette(p.id)}
        />
      ))}
    </div>
  )
}
