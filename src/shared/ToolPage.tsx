import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ToolDefinition } from '../tools/registry'

interface ToolPageProps extends Pick<ToolDefinition, 'name' | 'tagline'> {
  children: ReactNode
}

/**
 * Consistent page chrome for every tool: back link, title, tagline.
 * Wrap your tool's UI in this so all tools share the same frame.
 */
export function ToolPage({ name, tagline, children }: ToolPageProps) {
  return (
    <>
      <div className="tool-page-header">
        <Link to="/" className="back-link">
          ← all tools
        </Link>
        <h1>{name}</h1>
        <p className="tagline">{tagline}</p>
      </div>
      {children}
    </>
  )
}
