import {Edge, Graph} from './types'

const edgeLength = (graph: Graph, edge: Edge) => {
  const startNode = graph.nodes[edge.source]
  const endNode = graph.nodes[edge.target]
  return Phaser.Math.Distance.Between(
    startNode.x,
    startNode.y,
    endNode.x,
    endNode.y
  )
}

// Tweaked from ChatGPT - Might need to be reimplemented but good enough for now
export function dijkstra(
  graph: Graph,
  startIndex: number,
  endIndex: number
): number[] | null {
  const distances: Record<number, number> = {}
  const previous: Record<number, number | null> = {}
  const queue: number[] = graph.nodes.map((_, index) => index)

  // set initial distances to infinity and previous nodes to null
  for (let i = 0; i < graph.nodes.length; i++) {
    distances[i] = Infinity
    previous[i] = null
  }
  distances[startIndex] = 0

  while (queue.length > 0) {
    // find node with smallest distance
    const currentNode = queue.reduce((minNode, node) => {
      if (distances[node] < distances[minNode]) {
        return node
      } else {
        return minNode
      }
    }, queue[0])

    if (currentNode === endIndex) {
      // reconstruct path and return it as an array of edge indices
      const path: number[] = []
      let node = endIndex
      while (previous[node]) {
        const edge = [previous[node]!, node]
        const edgeIndex = graph.edges.findIndex(
          (e) => e.source === edge[0] && e.target === edge[1]
        )
        path.push(edgeIndex)
        node = previous[node]!
      }
      return path.reverse()
    }

    // remove currentNode from queue
    queue.splice(queue.indexOf(currentNode), 1)

    // update distances and previous nodes for neighbors of currentNode
    for (const edge of graph.edges) {
      if (edge.source === currentNode) {
        const neighbor = edge.target

        const tentativeDistance =
          distances[currentNode] + edgeLength(graph, edge)

        if (tentativeDistance < distances[neighbor]) {
          distances[neighbor] = tentativeDistance
          previous[neighbor] = currentNode
        }
      }
    }
  }

  // no path found
  return null
}
