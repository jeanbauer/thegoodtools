import { useState } from 'react'
import { diffJson, validateJson, type DiffEntry } from './json-utils'

const KIND_LABEL: Record<DiffEntry['kind'], string> = {
  added: 'added',
  removed: 'removed',
  changed: 'changed',
  retyped: 'type changed',
}

export function ComparePanel() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [diffs, setDiffs] = useState<DiffEntry[] | null>(null)
  const [sideErrors, setSideErrors] = useState<{ left?: string; right?: string } | null>(null)
  const [identical, setIdentical] = useState(false)

  const compare = () => {
    const leftResult = validateJson(left)
    const rightResult = validateJson(right)
    const errors: { left?: string; right?: string } = {}
    if (!leftResult.ok) errors.left = leftResult.message
    if (!rightResult.ok) errors.right = rightResult.message
    if (Object.keys(errors).length > 0) {
      setSideErrors(errors)
      setDiffs(null)
      setIdentical(false)
      return
    }
    setSideErrors(null)
    const found = diffJson(JSON.parse(left), JSON.parse(right))
    setDiffs(found)
    setIdentical(found.length === 0)
  }

  return (
    <div className="json-op">
      <div className="json-two-col">
        <div className="json-field">
          <label htmlFor="json-left">First JSON</label>
          <textarea
            id="json-left"
            className="json-textarea json-textarea-half"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="The before…"
            spellCheck={false}
          />
          {sideErrors?.left && <p className="form-error">{sideErrors.left}</p>}
        </div>
        <div className="json-field">
          <label htmlFor="json-right">Second JSON</label>
          <textarea
            id="json-right"
            className="json-textarea json-textarea-half"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="…and the after"
            spellCheck={false}
          />
          {sideErrors?.right && <p className="form-error">{sideErrors.right}</p>}
        </div>
      </div>

      <button
        className="tbtn tbtn-primary"
        disabled={!left.trim() || !right.trim()}
        onClick={compare}
      >
        Compare &rsquo;em
      </button>

      {identical && (
        <div className="json-verdict json-verdict-ok" role="status">
          <strong>Identical ✓</strong>
          <span>Jason couldn&rsquo;t find a single difference. Suspicious.</span>
        </div>
      )}

      {diffs && diffs.length > 0 && (
        <div className="json-diff">
          <p className="json-count">
            {diffs.length} {diffs.length === 1 ? 'difference' : 'differences'}
            {diffs.length >= 200 ? ' (showing first 200)' : ''}
          </p>
          <ul>
            {diffs.map((d) => (
              <li key={`${d.path}-${d.kind}`} className={`json-diff-row json-diff-${d.kind}`}>
                <code className="json-diff-path">{d.path}</code>
                <span className="json-diff-kind">{KIND_LABEL[d.kind]}</span>
                <span className="json-diff-values">
                  {d.left !== undefined && <code className="json-diff-left">{d.left}</code>}
                  {d.left !== undefined && d.right !== undefined && <span aria-hidden> → </span>}
                  {d.right !== undefined && <code className="json-diff-right">{d.right}</code>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
