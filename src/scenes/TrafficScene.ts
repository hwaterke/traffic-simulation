import Phaser from 'phaser'
import {Road, Simulation, Vehicle} from '../simulation/Simulation'
import {GAME_HEIGHT, GRAPH} from '../constants'
import {closestNodeIndex} from '../utils'

const NODE_RADIUS = 6
const EDGE_WIDTH = 12
const VEHICLE_WIDTH = 6
const DEBUG = false

const COLOR = {
  ROADS: 0x666666,
  PINK: 0xff00ff,
  TEAL: 0x008080,
  RED_SIGNAL: 0xff0000,
  GREEN_SIGNAL: 0x00ff00,
}

export class TrafficScene extends Phaser.Scene {
  private simulation!: Simulation
  private graphics!: Phaser.GameObjects.Graphics
  private vehicleGraphics: Map<Vehicle, Phaser.GameObjects.Graphics> = new Map()

  // Vehicle selected by the user. (used to display debug info)
  private selectedVehicle: Vehicle | null = null
  private vehicleStats!: Phaser.GameObjects.Text

  private isPaused: boolean = false

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

    this.simulation.addTrafficSignals([[6], [8]])
    this.simulation.addTrafficSignals([[51], [47]])
    this.simulation.addTrafficSignals([[15], [32]])
    this.simulation.addTrafficSignals([[55], [56], [57]])

    this.graphics = this.add.graphics()
    this.vehicleStats = this.add.text(10, 10, 'Select a vehicle')
    this.add.text(
      10,
      GAME_HEIGHT - 20,
      'Shift click an intersection to spawn a vehicle. Press A to randomly add 10.'
    )

    // Monitor the Shift key
    const shift = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT
    )

    // User click
    this.input.on('pointerdown', (pointer: PointerEvent) => {
      // Select the vehicle below the mouse.
      this.selectedVehicle = this.vehicleAt(pointer.x, pointer.y)
      if (this.selectedVehicle === null) {
        this.vehicleStats.text = 'Select a vehicle'
      }

      // Did the user select a node to spawn a new vehicle?
      if (this.input.keyboard.checkDown(shift)) {
        // Find the node closest to the pointer position
        const closestNode = closestNodeIndex(
          this.simulation.graph,
          pointer.x,
          pointer.y
        )
        if (closestNode !== null) {
          this.simulation.addVehicle(closestNode)
        }
      }
    })

    this.input.keyboard.on('keydown-A', () => {
      for (let i = 0; i < 10; i++) {
        this.simulation.addVehicle(null)
      }
    })
    this.input.keyboard.on('keydown-P', () => {
      this.isPaused = !this.isPaused
    })
    this.input.keyboard.on('keydown-T', () => {
      this.simulation.tick()
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
    if (!this.isPaused) {
      this.simulation.update(time, delta)
    }

    // Draw the simulation
    this.draw()
  }

  private draw(): void {
    this.graphics.clear()
    this.drawRoads()
    this.drawNodes()

    // Draw vehicles
    this.graphics.fillStyle(0xff0000, 1)

    // Find the lead vehicle of the selected vehicle
    let leadVehicleDistance: {leadVehicle: Vehicle; distance: number} | null =
      null
    if (this.selectedVehicle) {
      // Find the index of the selected vehicle on his road.
      const road =
        this.simulation.roads[
          this.selectedVehicle.path[this.selectedVehicle.currentRoadIndex]
        ]
      const vehicleIndex = road.vehicles.indexOf(this.selectedVehicle)
      leadVehicleDistance = this.simulation.findDistanceToLeadVehicle({
        path: this.selectedVehicle.path,
        currentRoadIndex: this.selectedVehicle.currentRoadIndex,
        vehicleIndex,
      })
    }

    this.simulation.roads.forEach((road) => {
      road.vehicles.forEach((vehicle, vehicleIndex) => {
        const vehicleGraphics = this.vehicleGraphics.get(vehicle)!
        vehicleGraphics.clear()
        vehicleGraphics.x = road.source.x + vehicle.x * road.angleCos
        vehicleGraphics.y = road.source.y + vehicle.x * road.angleSin

        if (vehicle.acceleration < -0.001) {
          vehicleGraphics.fillStyle(0xff0000, 1)
        } else if (vehicle.acceleration > 0.001) {
          vehicleGraphics.fillStyle(0x00ff00, 1)
        } else {
          vehicleGraphics.fillStyle(0xffff00, 1)
        }

        if (this.selectedVehicle === vehicle) {
          vehicleGraphics.fillStyle(COLOR.PINK)
          this.vehicleStats.text = `Speed: ${vehicle.speed}\nMax speed: ${
            vehicle.maxSpeed
          }\nEngine max speed: ${vehicle.engineMaxSpeed}\nAcceleration: ${
            vehicle.acceleration
          }\nDistance to lead vehicle: ${
            leadVehicleDistance?.distance ?? 'NA'
          }\nIndex on road: ${vehicleIndex}`
          this.drawPath(vehicle.path)
        }
        if (leadVehicleDistance?.leadVehicle === vehicle) {
          vehicleGraphics.fillStyle(COLOR.TEAL)
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

    this.drawTrafficSignals()
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

  private drawPath(path: number[]) {
    this.graphics.lineStyle(1, COLOR.PINK)
    path.forEach((roadIndex) => {
      const road = this.simulation.roads[roadIndex]
      const startNode = road.source
      const endNode = road.target
      this.graphics.lineBetween(startNode.x, startNode.y, endNode.x, endNode.y)
    })
  }

  private drawRoads() {
    this.graphics.lineStyle(EDGE_WIDTH, COLOR.ROADS, 1)
    this.simulation.roads.forEach((road) => {
      const startNode = road.source
      const endNode = road.target
      this.graphics.lineBetween(startNode.x, startNode.y, endNode.x, endNode.y)
    })
  }

  private drawNodes() {
    this.graphics.fillStyle(DEBUG ? 0x00ffff : COLOR.ROADS, 1)
    this.simulation.graph.nodes.forEach((node) => {
      this.graphics.fillCircle(node.x, node.y, NODE_RADIUS)
    })
  }

  private drawTrafficSignals() {
    this.simulation.roads.forEach((road) => {
      if (road.trafficSignal) {
        if (road.redLight()) {
          this.graphics.lineStyle(EDGE_WIDTH + 2, COLOR.RED_SIGNAL)
        } else {
          this.graphics.lineStyle(EDGE_WIDTH + 2, COLOR.GREEN_SIGNAL)
        }

        this.graphics.lineBetween(
          road.target.x - 8 * road.angleCos,
          road.target.y - 8 * road.angleSin,
          road.target.x - 5 * road.angleCos,
          road.target.y - 5 * road.angleSin
        )
      }
    })
  }
}
