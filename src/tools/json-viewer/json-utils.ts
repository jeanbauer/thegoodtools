export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export interface JsonNode {
  id: string
  key: string
  value: unknown
  type: JsonType
  children?: JsonNode[]
  expanded: boolean
  level: number
  parent?: string
}

export function typeOf(value: unknown): JsonType {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value as JsonType
}

/** Builds the node tree. Large JSON starts more collapsed. */
export function parseJsonToNodes(data: unknown, startCollapsed: boolean): JsonNode {
  const build = (value: unknown, key: string, level: number, parentId: string): JsonNode => {
    const id = parentId ? `${parentId}.${key}` : key
    const type = typeOf(value)
    const node: JsonNode = {
      id,
      key,
      value,
      type,
      expanded: startCollapsed ? level < 1 : level < 2,
      level,
      parent: parentId || undefined,
    }
    if (type === 'object' && value !== null) {
      node.children = Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        build(v, k, level + 1, id),
      )
    } else if (type === 'array') {
      node.children = (value as unknown[]).map((item, i) => build(item, `[${i}]`, level + 1, id))
    }
    return node
  }
  return build(data, 'root', 0, '')
}

/** Rebuilds plain JSON from a node (used for per-node copy). */
export function extractNodeJson(node: JsonNode): unknown {
  if (node.type === 'object' && node.children) {
    return Object.fromEntries(node.children.map((c) => [c.key, extractNodeJson(c)]))
  }
  if (node.type === 'array' && node.children) {
    return node.children.map(extractNodeJson)
  }
  return node.value
}

/** Ids of every node whose key or string value contains the term. */
export function findMatches(root: JsonNode, term: string): string[] {
  const lower = term.toLowerCase()
  const results: string[] = []
  const walk = (node: JsonNode) => {
    const keyMatch = node.key.toLowerCase().includes(lower)
    const valueMatch =
      typeof node.value === 'string' && node.value.toLowerCase().includes(lower)
    if (keyMatch || valueMatch) results.push(node.id)
    node.children?.forEach(walk)
  }
  walk(root)
  return results
}

/** Returns a new tree with the node's `expanded` flipped. */
export function toggleNode(root: JsonNode, nodeId: string): JsonNode {
  const walk = (node: JsonNode): JsonNode => {
    if (node.id === nodeId) return { ...node, expanded: !node.expanded }
    if (node.children) return { ...node, children: node.children.map(walk) }
    return node
  }
  return walk(root)
}

/** Returns a new tree with all ancestors of nodeId expanded. */
export function expandPathTo(root: JsonNode, targetId: string): JsonNode {
  const walk = (node: JsonNode): [JsonNode, boolean] => {
    if (node.id === targetId) return [node, true]
    if (node.children) {
      let found = false
      const children = node.children.map((child) => {
        const [next, hit] = walk(child)
        if (hit) found = true
        return next
      })
      if (found) return [{ ...node, children, expanded: true }, true]
    }
    return [node, false]
  }
  return walk(root)[0]
}

/** Resets expansion to the initial depth. */
export function resetExpansion(root: JsonNode, startCollapsed: boolean): JsonNode {
  const walk = (node: JsonNode): JsonNode => ({
    ...node,
    expanded: startCollapsed ? node.level < 1 : node.level < 2,
    children: node.children?.map(walk),
  })
  return walk(root)
}

/* ---------- validation & diffing (format/validate/compare modes) ----- */

export interface ValidationResult {
  ok: boolean
  message?: string
  topType?: JsonType
  bytes?: number
}

export function validateJson(input: string): ValidationResult {
  if (!input.trim()) return { ok: false, message: 'Nothing to check yet.' }
  try {
    const parsed = JSON.parse(input) as unknown
    return { ok: true, topType: typeOf(parsed), bytes: new Blob([input]).size }
  } catch (e) {
    // V8 messages include position/line info — surface them when present.
    return { ok: false, message: e instanceof Error ? e.message : 'Invalid JSON' }
  }
}

export interface DiffEntry {
  path: string
  kind: 'added' | 'removed' | 'changed' | 'retyped'
  left?: string
  right?: string
}

const DIFF_LIMIT = 200

function preview(value: unknown): string {
  const s = JSON.stringify(value)
  if (s === undefined) return String(value)
  return s.length > 60 ? `${s.slice(0, 60)}…` : s
}

/** Structural diff of two parsed JSON values. Capped at DIFF_LIMIT entries. */
export function diffJson(a: unknown, b: unknown): DiffEntry[] {
  const out: DiffEntry[] = []

  const walk = (left: unknown, right: unknown, path: string) => {
    if (out.length >= DIFF_LIMIT) return
    const lt = typeOf(left)
    const rt = typeOf(right)
    if (lt !== rt) {
      out.push({ path, kind: 'retyped', left: preview(left), right: preview(right) })
      return
    }
    if (lt === 'object') {
      const lo = left as Record<string, unknown>
      const ro = right as Record<string, unknown>
      for (const key of new Set([...Object.keys(lo), ...Object.keys(ro)])) {
        if (out.length >= DIFF_LIMIT) return
        const childPath = `${path}.${key}`
        if (!(key in lo)) out.push({ path: childPath, kind: 'added', right: preview(ro[key]) })
        else if (!(key in ro)) out.push({ path: childPath, kind: 'removed', left: preview(lo[key]) })
        else walk(lo[key], ro[key], childPath)
      }
      return
    }
    if (lt === 'array') {
      const la = left as unknown[]
      const ra = right as unknown[]
      const max = Math.max(la.length, ra.length)
      for (let i = 0; i < max; i++) {
        if (out.length >= DIFF_LIMIT) return
        const childPath = `${path}[${i}]`
        if (i >= la.length) out.push({ path: childPath, kind: 'added', right: preview(ra[i]) })
        else if (i >= ra.length) out.push({ path: childPath, kind: 'removed', left: preview(la[i]) })
        else walk(la[i], ra[i], childPath)
      }
      return
    }
    if (left !== right) {
      out.push({ path, kind: 'changed', left: preview(left), right: preview(right) })
    }
  }

  walk(a, b, '$')
  return out
}
