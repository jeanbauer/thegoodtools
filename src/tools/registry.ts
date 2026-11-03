import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

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
  /** Emoji (for now) shown on the card. */
  icon: string
  /** Dynamic import powering code splitting and hover prefetch. */
  load: () => Promise<{ default: ComponentType }>
}

export interface RegisteredTool extends ToolDefinition {
  component: LazyExoticComponent<ComponentType>
}

const definitions: ToolDefinition[] = [
  {
    id: 'qr-code',
    name: 'QR Code',
    tagline: 'Point it at a link, drop your logo in the middle, done.',
    icon: '🔳',
    load: () => import('./qr-code'),
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
