import Phaser from 'phaser'
import {Simulation, Vehicle} from './Simulation'
import {GRAPH} from './constants'

const NODE_RADIUS = 6
const EDGE_WIDTH = 12
const VEHICLE_WIDTH = 6
const DEBUG = false

export class TrafficScene extends Phaser.Scene {
  private simulation!: Simulation
  private graphics!: Phaser.GameObjects.Graphics
  private vehicleGraphics: Map<Vehicle, Phaser.GameObjects.Graphics> = new Map()

  create(): void {
    this.vehicleGraphics = new Map()
    this.simulation = new Simulation(GRAPH, {
      onVehicleAdded: (vehicle) => {
        this.vehicleGraphics.set(vehicle, this.add.graphics())
      },
      onVehicleRemoved: (vehicle) => {
        this.vehicleGraphics.get(vehicle)!.destroy()
        this.vehicleGraphics.delete(vehicle)
      },
    })
    this.graphics = this.add.graphics()

    if (DEBUG) {
      // Draw number of each node for debugging purposes
      this.simulation.graph.nodes.forEach((node, index) => {
        this.add.text(node.x, node.y, `${index}`)
      })
      this.simulation.roads.forEach((road, index) => {
        this.add.text(
          (road.source.x + road.target.x) / 2,
          (road.source.y + road.target.y) / 2,
          `${index}`
        )
      })
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta)

    // Update the simulation
    this.simulation.update(time, delta)

    // Draw the simulation
    this.draw()
  }

  private draw(): void {
    this.graphics.clear()

    // Draw roads
    this.graphics.lineStyle(EDGE_WIDTH, 0x333333, 1)
    this.simulation.roads.forEach((road) => {
      const startNode = road.source
      const endNode = road.target
      this.graphics.lineBetween(startNode.x, startNode.y, endNode.x, endNode.y)
    })

    // Draw nodes
    this.graphics.fillStyle(DEBUG ? 0x00ffff : 0x333333, 1)
    this.simulation.graph.nodes.forEach((node) => {
      this.graphics.fillCircle(node.x, node.y, NODE_RADIUS)
    })

    // Draw vehicles
    this.graphics.fillStyle(0xff0000, 1)
    this.simulation.roads.forEach((road) => {
      road.vehicles.forEach((vehicle) => {
        const vehicleGraphics = this.vehicleGraphics.get(vehicle)!
        vehicleGraphics.clear()
        vehicleGraphics.x = road.source.x + vehicle.x * road.angleCos
        vehicleGraphics.y = road.source.y + vehicle.x * road.angleSin
        vehicleGraphics.fillStyle(0xffff00, 1)

        vehicleGraphics.fillRoundedRect(
          -vehicle.length / 2,
          -VEHICLE_WIDTH / 2,
          vehicle.length,
          VEHICLE_WIDTH,
          2
        )
        vehicleGraphics.rotation = road.angle
      })
    })
  }
}
