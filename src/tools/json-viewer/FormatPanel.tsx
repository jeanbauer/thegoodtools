import { useMemo, useState } from 'react'
import { SegmentedControl } from '../../shared/SegmentedControl'
import { CopyButton } from '../../shared/CopyButton'

type Indent = '2' | '4' | '0'

export function FormatPanel() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<Indent>('2')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null }
    try {
      const parsed = JSON.parse(input) as unknown
      return {
        output: indent === '0' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, Number(indent)),
        error: null,
      }
    } catch {
      return {
        output: '',
        error: 'Jason tried to tidy this but it\u2019s not valid JSON. Validate mode can point at the exact spot.',
      }
    }
  }, [input, indent])

  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = indent === '0' ? 'minified.json' : 'formatted.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="json-op">
      <textarea
        className="json-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste your messy JSON here…"
        spellCheck={false}
        aria-label="JSON to format"
      />
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="json-op-controls">
        <SegmentedControl
          label="Style"
          value={indent}
          onChange={setIndent}
          options={[
            { value: '2', label: '2 spaces' },
            { value: '4', label: '4 spaces' },
            { value: '0', label: 'Minified' },
          ]}
        />
        {output && (
          <div className="json-op-actions">
            <CopyButton value={output} />
            <button className="copy-btn" onClick={download}>
              Download .json
            </button>
          </div>
        )}
      </div>
      {output && (
        <pre className="json-output" tabIndex={0}>
          {output}
        </pre>
      )}
    </div>
  )
}
