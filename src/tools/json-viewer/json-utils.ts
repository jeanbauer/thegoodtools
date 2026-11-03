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
