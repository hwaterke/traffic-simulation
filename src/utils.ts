import {Graph} from './types'

export const randomElement = <T>(list: T[]): T => {
  return list[Math.floor(Math.random() * list.length)]
}

export const closestNodeIndex = (
  graph: Graph,
  x: number,
  y: number
): number | null => {
  for (const [index, node] of graph.nodes.entries()) {
    if (Math.abs(node.x - x) < 10 && Math.abs(node.y - y) < 10) {
      return index
    }
  }
  return null
}
