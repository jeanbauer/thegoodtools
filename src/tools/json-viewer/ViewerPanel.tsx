import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SegmentedControl } from '../../shared/SegmentedControl'
import {
  expandPathTo,
  extractNodeJson,
  findMatches,
  parseJsonToNodes,
  resetExpansion,
  toggleNode,
  type JsonNode,
} from './json-utils'
import jasonUrl from './jason.png'
import './json-viewer.css'

const FLOW_NODE_W = 200
const FLOW_NODE_H = 90
const FLOW_LEVEL_GAP = 280
const FLOW_ROW_GAP = 110
const FLOW_PAGE = 100

const TYPE_COLORS: Record<string, string> = {
  object: '#2563eb',
  array: '#0e9f6e',
  string: '#0d9488',
  number: '#7c3aed',
  boolean: '#d97706',
  null: '#6b7280',
}

function renderValue(value: unknown, type: string) {
  switch (type) {
    case 'string':
      return <span className="json-value">&quot;{String(value)}&quot;</span>
    case 'number':
    case 'boolean':
      return <span className="json-value">{String(value)}</span>
    case 'null':
      return <span className="json-value">null</span>
    default:
      return null
  }
}

export function ViewerPanel() {
  const [input, setInput] = useState('')
  const [root, setRoot] = useState<JsonNode | null>(null)
  const [isLarge, setIsLarge] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'tree' | 'flow'>('tree')
  const [zoom, setZoom] = useState(100)
  const [flowLimit, setFlowLimit] = useState(FLOW_PAGE)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [resultIndex, setResultIndex] = useState(0)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const treeRef = useRef<HTMLDivElement>(null)

  const visualize = useCallback(() => {
    setError(null)
    setCopiedId(null)
    try {
      const parsed = JSON.parse(input) as unknown
      const large = input.split('\n').length > 100
      setIsLarge(large)
      setRoot(parseJsonToNodes(parsed, large))
      setResults([])
      setResultIndex(0)
      setSearchTerm('')
      setFlowLimit(FLOW_PAGE)
    } catch {
      setError('Jason squinted at this and gave up — it\u2019s not valid JSON. Check commas and quotes?')
      setRoot(null)
    }
  }, [input])

  const reset = () => {
    setInput('')
    setRoot(null)
    setError(null)
    setSearchTerm('')
    setResults([])
    setResultIndex(0)
    setZoom(100)
    setView('tree')
  }

  /* ----- search ----- */

  const runSearch = useCallback(
    (term: string) => {
      if (!root || !term.trim()) {
        setResults([])
        setResultIndex(0)
        return
      }
      const found = findMatches(root, term)
      setResults(found)
      setResultIndex(0)
      if (found.length > 0) {
        setRoot((current) => (current ? expandPathTo(current, found[0]) : current))
        setTimeout(() => {
          document
            .querySelector(`[data-node-id="${CSS.escape(found[0])}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 60)
      }
    },
    [root],
  )

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!searchTerm.trim()) {
      setResults([])
      return
    }
    searchTimeout.current = setTimeout(() => runSearch(searchTerm), 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchTerm, runSearch])

  const jumpToResult = (index: number) => {
    if (index < 0 || index >= results.length || !root) return
    setResultIndex(index)
    setRoot(expandPathTo(root, results[index]))
    setTimeout(() => {
      document
        .querySelector(`[data-node-id="${CSS.escape(results[index])}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  const highlighted = useMemo(
    () => (root && searchTerm.trim() ? new Set(findMatches(root, searchTerm)) : new Set<string>()),
    [root, searchTerm],
  )

  /* ----- copy ----- */

  const copyNode = async (node: JsonNode) => {
    const value = extractNodeJson(node)
    const wrapped =
      node.key === 'root' || /^\[\d+\]$/.test(node.key) ? value : { [node.key]: value }
    await navigator.clipboard.writeText(JSON.stringify(wrapped, null, 2))
    setCopiedId(node.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  /* ----- tree rendering ----- */

  const renderTreeNode = (node: JsonNode): ReactNode => {
    const hasChildren = !!node.children?.length
    const isHit = highlighted.has(node.id)
    const isCurrent = results.length > 0 && results[resultIndex] === node.id

    return (
      <div key={node.id} data-node-id={node.id}>
        <div
          className={`json-row${isHit ? ' json-hit' : ''}${isCurrent ? ' json-hit-current' : ''}`}
          style={{ marginLeft: node.level * 26 }}
        >
          {hasChildren ? (
            <button
              className="json-expander"
              aria-label={node.expanded ? 'Collapse' : 'Expand'}
              aria-expanded={node.expanded}
              onClick={() => setRoot((current) => current && toggleNode(current, node.id))}
            >
              {node.expanded ? '▾' : '▸'}
            </button>
          ) : (
            <span className="json-expander-spacer" />
          )}

          <span className="json-key">{node.key}:</span>
          <span className={`json-type json-type-${node.type}`}>{node.type}</span>
          {hasChildren ? (
            <span className="json-count">
              {node.type === 'array' ? `[${node.children!.length}]` : `{${node.children!.length}}`}
            </span>
          ) : (
            renderValue(node.value, node.type)
          )}

          <button
            className={`json-copy${copiedId === node.id ? ' json-copied' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              void copyNode(node)
            }}
          >
            {copiedId === node.id ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {hasChildren && node.expanded && <div>{node.children!.map(renderTreeNode)}</div>}
      </div>
    )
  }

  /* ----- flow rendering ----- */

  interface FlowNode extends JsonNode {
    x: number
    y: number
  }

  const flowNodes = useMemo((): FlowNode[] => {
    if (!root) return []
    const nodes: FlowNode[] = []
    const levelPositions: Record<number, number> = {}
    const walk = (node: JsonNode) => {
      const pos = levelPositions[node.level] ?? 0
      levelPositions[node.level] = pos + 1
      nodes.push({
        ...node,
        x: node.level * FLOW_LEVEL_GAP + 50,
        y: pos * (FLOW_NODE_H + FLOW_ROW_GAP) + 50,
      })
      if (node.expanded) node.children?.forEach(walk)
    }
    walk(root)
    return nodes
  }, [root])

  const visibleFlowNodes = flowNodes.slice(0, flowLimit)

  const renderFlow = () => {
    if (visibleFlowNodes.length === 0) {
      return <p className="json-empty-note">Expand some nodes in the tree and they'll show up here.</p>
    }
    const byId = new Map(visibleFlowNodes.map((n) => [n.id, n]))
    const maxX = Math.max(...visibleFlowNodes.map((n) => n.x + FLOW_NODE_W)) + 60
    const maxY = Math.max(...visibleFlowNodes.map((n) => n.y + FLOW_NODE_H)) + 60

    return (
      <>
        <span className="json-flow-hint">
          {visibleFlowNodes.length} of {flowNodes.length} nodes
        </span>
        <svg
          width={maxX * (zoom / 100)}
          height={maxY * (zoom / 100)}
          viewBox={`0 0 ${maxX} ${maxY}`}
          style={{ display: 'block' }}
        >
          {visibleFlowNodes.map((node) => {
            if (!node.parent) return null
            const parent = byId.get(node.parent)
            if (!parent) return null
            const sx = parent.x + FLOW_NODE_W
            const sy = parent.y + FLOW_NODE_H / 2
            const ex = node.x
            const ey = node.y + FLOW_NODE_H / 2
            return (
              <path
                key={`c-${node.id}`}
                d={`M ${sx} ${sy} L ${sx + 50} ${sy} L ${sx + 50} ${ey} L ${ex} ${ey}`}
                stroke="var(--color-border)"
                strokeWidth="2"
                fill="none"
              />
            )
          })}
          {visibleFlowNodes.map((node) => {
            const color = TYPE_COLORS[node.type]
            const hasChildren = !!node.children?.length
            return (
              <g
                key={node.id}
                className="json-flow-node"
                onClick={() =>
                  hasChildren && setRoot((current) => current && toggleNode(current, node.id))
                }
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={FLOW_NODE_W}
                  height={FLOW_NODE_H}
                  rx="12"
                  fill={`${color}14`}
                  stroke={color}
                  strokeWidth="2"
                />
                <text x={node.x + 12} y={node.y + 26} fontSize="14" fontWeight="600" fill="var(--color-ink)">
                  {node.key.length > 20 ? `${node.key.slice(0, 20)}…` : node.key}
                </text>
                <text x={node.x + 12} y={node.y + 46} fontSize="11" fill={color}>
                  {node.type}
                </text>
                <text x={node.x + 12} y={node.y + 70} fontSize="12" fill="var(--color-muted)">
                  {hasChildren
                    ? `${node.type === 'array' ? '[' : '{'}${node.children!.length}${node.type === 'array' ? ']' : '}'}${node.expanded ? '' : ' — click to expand'}`
                    : typeof node.value === 'string'
                      ? `"${node.value.length > 24 ? node.value.slice(0, 24) + '…' : node.value}"`
                      : String(node.value)}
                </text>
              </g>
            )
          })}
        </svg>
        {flowNodes.length > flowLimit && (
          <div className="json-more-row">
            <button className="json-mini-btn" onClick={() => setFlowLimit((n) => n + FLOW_PAGE)}>
              Show 100 more
            </button>
          </div>
        )}
      </>
    )
  }

  /* ----- render ----- */

  if (!root) {
    return (
      <>
        <div className="json-hero">
          <div className="json-jason">
            <img src={jasonUrl} alt="Jason, your JSON guy" />
            <p className="json-jason-bubble">
              Hey there! I&rsquo;m Jason. Got some JSON? Paste it below and I&rsquo;ll show you
              what&rsquo;s inside.
            </p>
          </div>
          <textarea
            className="json-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here… Jason is waiting."
            spellCheck={false}
          />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button
            className="tbtn tbtn-primary json-go"
            disabled={!input.trim()}
            onClick={visualize}
          >
            Show me that JSON
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="json-toolbar">
        <SegmentedControl
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'tree', label: 'Tree' },
            { value: 'flow', label: 'Flow chart' },
          ]}
        />
        <div className="json-search">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keys and values…"
            aria-label="Search keys and values"
          />
          {results.length > 0 && (
            <>
              <span className="json-count">
                {resultIndex + 1}/{results.length}
              </span>
              <button
                className="json-mini-btn"
                disabled={resultIndex === 0}
                onClick={() => jumpToResult(resultIndex - 1)}
                aria-label="Previous result"
              >
                ↑
              </button>
              <button
                className="json-mini-btn"
                disabled={resultIndex === results.length - 1}
                onClick={() => jumpToResult(resultIndex + 1)}
                aria-label="Next result"
              >
                ↓
              </button>
            </>
          )}
        </div>
        <div className="json-zoom">
          <button
            className="json-mini-btn"
            disabled={zoom <= 50}
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            aria-label="Zoom out"
          >
            −
          </button>
          <span>{zoom}%</span>
          <button
            className="json-mini-btn"
            disabled={zoom >= 200}
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        <button
          className="json-mini-btn"
          onClick={() => setRoot(resetExpansion(root, isLarge))}
          title="Reset expanded state"
        >
          Collapse reset
        </button>
        <button className="json-mini-btn" onClick={reset}>
          New JSON
        </button>
      </div>

      {view === 'tree' ? (
        <div
          className="json-tree-panel"
          ref={treeRef}
          style={{ fontSize: `${zoom}%` }}
        >
          {renderTreeNode(root)}
        </div>
      ) : (
        <div className="json-flow-panel">{renderFlow()}</div>
      )}
    </>
  )
}
