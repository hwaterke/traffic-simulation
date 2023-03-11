import Phaser from 'phaser'
import {Graph} from '../types'
import {GRAPH} from '../constants'

const NODE_RADIUS = 6
const EDGE_WIDTH = 4

const findNodeIndexBelow = (graph: Graph, x: number, y: number) => {
  return graph.nodes.findIndex((node) => {
    return (
      Math.abs(node.x - x) <= NODE_RADIUS && Math.abs(node.y - y) <= NODE_RADIUS
    )
  })
}

export class GraphBuilderScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics | undefined
  private graph!: Graph
  private selectedNodeIndex: number | null = null

  create(): void {
    this.graph = GRAPH //{nodes: [], edges: []}
    this.graphics = this.add.graphics()

    // Monitor the Shift key
    const shift = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT
    )

    // Delete selected node
    this.input.keyboard.on('keydown-D', (event) => {
      if (this.selectedNodeIndex !== null) {
        // Remove all edges containing that node
        this.graph.edges = this.graph.edges.filter(
          (edge) =>
            edge.source !== this.selectedNodeIndex &&
            edge.target !== this.selectedNodeIndex
        )
        this.graph.nodes.splice(this.selectedNodeIndex, 1)
        // Shift down all indexes of nodes
        this.graph.edges = this.graph.edges.map((edge) => ({
          source:
            edge.source > this.selectedNodeIndex!
              ? edge.source - 1
              : edge.source,
          target:
            edge.target > this.selectedNodeIndex!
              ? edge.target - 1
              : edge.target,
        }))
        this.selectedNodeIndex = null
      }
    })

    this.input.on('pointerdown', (pointer) => {
      // Shift is used to join the selected edge with the one clicked.
      if (
        this.input.keyboard.checkDown(shift) &&
        this.selectedNodeIndex !== null
      ) {
        const nodeIndex = findNodeIndexBelow(this.graph!, pointer.x, pointer.y)

        if (nodeIndex >= 0) {
          // Draw edge
          this.graph!.edges.push({
            source: this.selectedNodeIndex,
            target: nodeIndex,
          })

          this.selectedNodeIndex = null
        }
      } else {
        if (this.selectedNodeIndex) {
          // Move it instead of creating a new node
          this.graph!.nodes[this.selectedNodeIndex] = {
            x: pointer.x,
            y: pointer.y,
          }
          this.selectedNodeIndex = null
        } else {
          // Add new node unless there's one there.
          const nodeBelow = findNodeIndexBelow(
            this.graph!,
            pointer.x,
            pointer.y
          )

          if (nodeBelow === -1) {
            this.graph!.nodes.push({
              x: pointer.x,
              y: pointer.y,
            })
          } else {
            this.selectedNodeIndex = nodeBelow
          }
        }
      }

      console.log(JSON.stringify(this.graph))
    })
  }

  update(time: number, delta: number) {
    super.update(time, delta)

    this.graphics!.clear()

    // Draw edges
    this.graphics!.lineStyle(EDGE_WIDTH, 0xffffdd, 1)
    this.graphics!.lineGradientStyle(
      4,
      0x00ff00,
      0x0000ff,
      0x00ff00,
      0x0000ff,
      1
    )

    for (const edge of this.graph!.edges) {
      const startNode = this.graph!.nodes[edge.source]
      const endNode = this.graph!.nodes[edge.target]

      this.graphics!.lineBetween(startNode.x, startNode.y, endNode.x, endNode.y)
    }

    // Draw nodes
    this.graphics!.fillStyle(0x00ffff, 1)

    this.graph!.nodes.forEach((node, index) => {
      if (index === this.selectedNodeIndex) {
        this.graphics!.fillStyle(0x00ff00, 1)
        this.graphics!.fillCircle(node.x, node.y, NODE_RADIUS * 2)
        this.graphics!.fillStyle(0x00ffff, 1)
      } else {
        this.graphics!.fillCircle(node.x, node.y, NODE_RADIUS)
      }
    })
  }
}
