import { useState } from 'react'
import { validateJson } from './json-utils'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ValidatePanel() {
  const [input, setInput] = useState('')
  const result = input.trim() ? validateJson(input) : null

  return (
    <div className="json-op">
      <textarea
        className="json-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste JSON and Jason will check it twice…"
        spellCheck={false}
        aria-label="JSON to validate"
      />
      {result &&
        (result.ok ? (
          <div className="json-verdict json-verdict-ok" role="status">
            <strong>Valid JSON ✓</strong>
            <span>
              Top level: {result.topType} · {formatBytes(result.bytes ?? 0)} · Jason approves.
            </span>
          </div>
        ) : (
          <div className="json-verdict json-verdict-bad" role="alert">
            <strong>Not valid JSON ✗</strong>
            <span>{result.message}</span>
          </div>
        ))}
    </div>
  )
}
