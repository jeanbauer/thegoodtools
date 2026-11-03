import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'

/**
 * Central registry of every tool in the shell.
 *
 * The landing page grid and the router are both generated from this list,
 * so adding a tool is exactly two steps:
 *
 *   1. Create src/tools/<id>/index.tsx exporting the tool as default.
 *   2. Add an entry below.
 *
 * Each entry's `load` is a dynamic import, so Vite splits every tool into
 * its own chunk that only downloads when the user opens (or hovers) it.
 */
export interface ToolDefinition {
  /** URL slug — the tool lives at /tools/<id>. Also the folder name. */
  id: string
  /** Display name on the card and the tool page. */
  name: string
  /** One-line description shown on the card. */
  tagline: string
  /** Emoji or small SVG shown on the card. */
  icon: ReactNode
  /** Dynamic import powering code splitting and hover prefetch. */
  load: () => Promise<{ default: ComponentType }>
}

export interface RegisteredTool extends ToolDefinition {
  component: LazyExoticComponent<ComponentType>
}

const definitions: ToolDefinition[] = [
  {
    id: 'qr-code',
    name: 'QR Code Helper',
    tagline: 'Point it at a link, drop your logo in the middle, done.',
    icon: <QrIcon />,
    load: () => import('./qr-code'),
  },
  {
    id: 'pdf-split-merge',
    name: 'PDF Split & Merge',
    tagline: 'Take pages out of a PDF, or squish several into one.',
    icon: '📄',
    load: () => import('./pdf-split-merge'),
  },
  // Add the next tool here — folder + entry, that's the whole ritual.
]

export const tools: RegisteredTool[] = definitions.map((definition) => ({
  ...definition,
  component: lazy(definition.load),
}))

export function findTool(id: string): RegisteredTool | undefined {
  return tools.find((tool) => tool.id === id)
}

/** QR glyph for the QR Code Helper card — reads as a QR at small sizes. */
function QrIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="12" y="1" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="1" y="12" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="12.5" y="12.5" width="2.6" height="2.6" rx="0.6" />
      <rect x="16.4" y="12.5" width="2.6" height="2.6" rx="0.6" />
      <rect x="12.5" y="16.4" width="2.6" height="2.6" rx="0.6" />
      <rect x="16.4" y="16.4" width="2.6" height="2.6" rx="0.6" />
    </svg>
  )
}
