import Phaser from 'phaser'
import {Road, Simulation, Vehicle} from '../Simulation'
import {GRAPH} from '../constants'

const NODE_RADIUS = 6
const EDGE_WIDTH = 12
const VEHICLE_WIDTH = 6
const DEBUG = false

export class TrafficScene extends Phaser.Scene {
  private simulation!: Simulation
  private graphics!: Phaser.GameObjects.Graphics
  private vehicleGraphics: Map<Vehicle, Phaser.GameObjects.Graphics> = new Map()

  // Vehicle selected by the user. (used to display debug info)
  private selectedVehicle: Vehicle | null = null
  private vehicleStats!: Phaser.GameObjects.Text

  create(): void {
    this.vehicleGraphics = new Map()
    this.simulation = new Simulation(GRAPH, {
      onVehicleAdded: (vehicle) => {
        this.vehicleGraphics.set(vehicle, this.add.graphics())
      },
      onVehicleRemoved: (vehicle) => {
        this.vehicleGraphics.get(vehicle)!.destroy()
        this.vehicleGraphics.delete(vehicle)
        if (this.selectedVehicle === vehicle) {
          this.selectedVehicle = null
          this.vehicleStats.text = 'Select a vehicle'
        }
      },
    })

    this.graphics = this.add.graphics()
    this.vehicleStats = this.add.text(10, 10, 'Select a vehicle')

    this.input.on('pointerdown', (pointer: PointerEvent) => {
      // Select the vehicle below the mouse.
      this.selectedVehicle = this.vehicleAt(pointer.x, pointer.y)
      if (this.selectedVehicle === null) {
        this.vehicleStats.text = 'Select a vehicle'
      }
    })

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

        if (this.selectedVehicle === vehicle) {
          vehicleGraphics.fillStyle(0xff0000, 1)
          this.vehicleStats.text = `Speed: ${vehicle.speed}\nMax: ${vehicle.maxSpeed}`
        }

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

  private vehicleAt(x: number, y: number): Vehicle | null {
    for (const road of this.simulation.roads) {
      for (const vehicle of road.vehicles) {
        const vehiclePosition = this.getVehiclePosition(road, vehicle)
        if (
          Math.abs(vehiclePosition.x - x) < vehicle.length &&
          Math.abs(vehiclePosition.y - y) < vehicle.length
        ) {
          return vehicle
        }
      }
    }
    return null
  }

  private getVehiclePosition(
    road: Road,
    vehicle: Vehicle
  ): {x: number; y: number} {
    return {
      x: road.source.x + vehicle.x * road.angleCos,
      y: road.source.y + vehicle.x * road.angleSin,
    }
  }
}
