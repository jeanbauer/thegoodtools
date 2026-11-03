import { useState } from 'react'
import { ToolPage } from '../../shared/ToolPage'
import { ViewerPanel } from './ViewerPanel'
import { FormatPanel } from './FormatPanel'
import { ValidatePanel } from './ValidatePanel'
import { ComparePanel } from './ComparePanel'
import jasonUrl from './jason.png'
import './json-viewer.css'

type Mode = 'view' | 'format' | 'validate' | 'compare'

const modes: { id: Mode; icon: string; title: string; text: string }[] = [
  {
    id: 'view',
    icon: '🌳',
    title: 'View it',
    text: 'Explore as a tree or a flow chart — click around inside your JSON.',
  },
  {
    id: 'format',
    icon: '🧹',
    title: 'Format it',
    text: 'Tidy it up with indents, or squash it flat for shipping.',
  },
  {
    id: 'validate',
    icon: '🔍',
    title: 'Validate it',
    text: 'Jason checks it twice and points at exactly where it broke.',
  },
  {
    id: 'compare',
    icon: '⚖️',
    title: 'Compare two',
    text: 'Two JSONs enter. Jason spots every difference.',
  },
]

export default function JsonViewerTool() {
  const [mode, setMode] = useState<Mode | null>(null)

  return (
    <ToolPage
      name="Show Me That JSON"
      tagline="Jason does JSON: view it, format it, validate it, or compare two side by side."
    >
      {mode === null ? (
        <div className="json-hero">
          <div className="json-jason">
            <img src={jasonUrl} alt="Jason, your JSON guy" />
            <p className="json-jason-bubble">
              Hey! I&rsquo;m Jason. What are we doing with your JSON today?
            </p>
          </div>
          <div className="json-picker">
            {modes.map((m) => (
              <button key={m.id} className="json-mode-card" onClick={() => setMode(m.id)}>
                <span className="json-mode-icon" aria-hidden>
                  {m.icon}
                </span>
                <span className="json-mode-title">{m.title}</span>
                <span className="json-mode-text">{m.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="json-mode-wrap">
          <button className="json-back" onClick={() => setMode(null)}>
            ← all of Jason&rsquo;s tricks
          </button>
          {mode === 'view' && <ViewerPanel />}
          {mode === 'format' && <FormatPanel />}
          {mode === 'validate' && <ValidatePanel />}
          {mode === 'compare' && <ComparePanel />}
        </div>
      )}
    </ToolPage>
  )
}
