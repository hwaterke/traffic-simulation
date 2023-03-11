// Raw representation of the graph (serializable)

export type Node = {
  readonly x: number
  readonly y: number
}

export type Edge = {
  source: number // Index of the starting Node
  target: number // Index of the end Node
}

export type Graph = {
  nodes: Node[]
  edges: Edge[]
}
