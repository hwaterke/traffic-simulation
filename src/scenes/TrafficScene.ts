import Phaser from 'phaser'
import {Lane, ROAD_TYPES, Simulation} from '../simulation/Simulation'
import {GAME_HEIGHT, GAME_WIDTH} from '../constants'
import {Vehicle} from '../simulation/Vehicle'

const LANE_NODE_RADIUS = 3
const EDGE_WIDTH = 16
const VEHICLE_WIDTH = 6
const DEBUG = false

const LANE_WIDTH = 1

const COLOR = {
  ROAD: 0x666666,
  ROAD_NODE: 0x666666,
  LANE: 0xff0000,
  LANE_CONNECTIONS: 0x00ff00,
  LANE_NODE: 0x00ff00,

  PINK: 0xff00ff,
  TEAL: 0x008080,
  RED_SIGNAL: 0xff0000,
  GREEN_SIGNAL: 0x00ff00,
}

export class TrafficScene extends Phaser.Scene {
  private simulation!: Simulation
  private graphics!: Phaser.GameObjects.Graphics

  // TODO this is never cleaned up !
  private vehicleGraphics: Map<Vehicle, Phaser.GameObjects.Graphics> = new Map()

  // Vehicle selected by the user. (used to display debug info)
  private selectedVehicle: Vehicle | null = null
  private vehicleStats!: Phaser.GameObjects.Text

  private isPaused: boolean = false
  private cameraControls!: Phaser.Cameras.Controls.FixedKeyControl

  create(): void {
    this.vehicleGraphics = new Map()
    this.simulation = new Simulation({
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

    // Roundabout
    this.simulation.addRoad(
      {x: 700, y: 450},
      {x: 800, y: 550},
      ROAD_TYPES.LANES_4,
      {
        x: 700,
        y: 550,
      }
    )
    this.simulation.addRoad(
      {x: 800, y: 550},
      {x: 900, y: 450},
      ROAD_TYPES.LANES_4,
      {
        x: 900,
        y: 550,
      }
    )
    this.simulation.addRoad(
      {x: 900, y: 450},
      {x: 800, y: 350},
      ROAD_TYPES.LANES_4,
      {
        x: 900,
        y: 350,
      }
    )
    this.simulation.addRoad(
      {x: 800, y: 350},
      {x: 700, y: 450},
      ROAD_TYPES.LANES_4,
      {
        x: 700,
        y: 350,
      }
    )

    // Below roundabout
    this.simulation.addRoad(
      {x: 800, y: 550},
      {x: 800, y: 650},
      ROAD_TYPES.BASIC
    )
    // Left of roundabout
    this.simulation.addRoad(
      {x: 700, y: 450},
      {x: 600, y: 450},
      ROAD_TYPES.BASIC
    )
    // Connect the two
    this.simulation.addRoad(
      {x: 800, y: 650},
      {x: 600, y: 450},
      ROAD_TYPES.LANES_8,
      {
        x: 600,
        y: 650,
      }
    )
    // Right of roundabout
    this.simulation.addRoad(
      {x: 900, y: 450},
      {x: 1000, y: 450},
      ROAD_TYPES.BASIC
    )
    this.simulation.addRoad(
      {x: 1000, y: 450},
      {x: 800, y: 650},
      ROAD_TYPES.BASIC
    )

    this.simulation.addRoad(
      {x: 800, y: 650},
      {x: 800, y: 850},
      ROAD_TYPES.BASIC
    )

    this.simulation.addRoad(
      {x: 800, y: 650},
      {x: 1000, y: 850},
      ROAD_TYPES.BASIC
    )

    this.simulation.addRoad(
      {x: 800, y: 850},
      {x: 1000, y: 850},
      ROAD_TYPES.BASIC
    )

    this.simulation.addRoad(
      {x: 1000, y: 450},
      {x: 1000, y: 850},
      ROAD_TYPES.LANES_8,
      {
        x: 1400,
        y: 850,
      }
    )

    /*
    this.simulation.addTrafficSignals([
      [25, 22],
      [14, 26],
    ])
    this.simulation.addTrafficSignals([[21], [18]])
    this.simulation.addTrafficSignals([[39], [13]])
    this.simulation.addTrafficSignals([[27], [38]])

     */

    this.setupCamera()

    this.graphics = this.add.graphics()
    this.vehicleStats = this.add.text(10, 10, 'Select a vehicle')
    this.add.text(
      10,
      GAME_HEIGHT - 20,
      'Shift click an intersection to spawn a vehicle. Press C to randomly add 10.'
    )

    // Monitor the Shift key
    const shift = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT
    )

    // User click
    this.input.on('pointerdown', (pointer: PointerEvent) => {
      const click = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

      // Select the vehicle below the mouse.
      this.selectedVehicle = this.vehicleAt(click.x, click.y)
      if (this.selectedVehicle === null) {
        this.vehicleStats.text = 'Select a vehicle'
      }

      // Did the user select a node to spawn a new vehicle?
      if (this.input.keyboard.checkDown(shift)) {
        // Find the node closest to the pointer position
        const closestNode = this.simulation.findNodeAt(click, 10)
        if (closestNode !== null) {
          this.simulation.addVehicle(closestNode)
        }
      }
    })

    this.input.keyboard.on('keydown-C', () => {
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
      /*
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

       */
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta)
    this.cameraControls.update(delta)

    // Update the simulation
    if (!this.isPaused) {
      this.simulation.tick()
    }

    // Draw the simulation
    this.draw()
  }

  private draw(): void {
    this.graphics.clear()
    this.drawRoads()
    this.drawRoadNodes()
    this.drawLanes()
    this.drawLaneConnections()
    this.drawLaneNodes()
    this.drawVehicles()
    this.drawTrafficSignals()
  }

  private vehicleAt(x: number, y: number): Vehicle | null {
    for (const road of this.simulation.roads) {
      for (const lane of road.lanes) {
        for (const vehicle of lane.vehicles) {
          const vehiclePosition = lane.getPointAt(vehicle.x)
          if (
            Math.abs(vehiclePosition.x - x) < vehicle.length &&
            Math.abs(vehiclePosition.y - y) < vehicle.length
          ) {
            return vehicle
          }
        }
      }
    }
    return null
  }

  private drawPath(path: Lane[]) {
    this.graphics.lineStyle(1, COLOR.PINK)
    path.forEach((lane) => {
      lane.curve.draw(this.graphics)
    })
  }

  private drawRoads() {
    this.simulation.roads.forEach((road) => {
      this.graphics.lineStyle(road.getWidth(), COLOR.ROAD, 1)
      road.curve.draw(this.graphics)
    })
  }

  private drawRoadNodes() {
    this.graphics.fillStyle(COLOR.ROAD_NODE)
    this.simulation.nodes.forEach((node) => {
      this.graphics.fillCircle(node.x, node.y, node.size() / 2)
    })
  }

  private drawLanes() {
    this.graphics.lineStyle(LANE_WIDTH, COLOR.LANE, 1)
    this.simulation.roads.forEach((road) => {
      road.lanes.forEach((lane) => {
        lane.curve.draw(this.graphics)
      })
    })
  }

  private drawLaneConnections() {
    this.graphics.lineStyle(LANE_WIDTH, COLOR.LANE_CONNECTIONS, 1)
    this.simulation.nodes.forEach((node) => {
      node.connectionLanes.forEach((lane) => {
        lane.curve.draw(this.graphics)
      })
    })
  }

  private drawLaneNodes() {
    this.graphics.fillStyle(COLOR.LANE_NODE, 0.4)

    this.simulation.nodes.forEach((node) => {
      const incoming = node.getIncomingLaneNode()
      this.graphics.fillStyle(0xfff000, 0.4)
      incoming.forEach((laneNode) => {
        this.graphics.fillCircle(laneNode.x, laneNode.y, LANE_NODE_RADIUS)
      })

      const outgoing = node.getOutgoingLaneNode()
      this.graphics.fillStyle(0x000fff, 0.4)
      outgoing.forEach((laneNode) => {
        this.graphics.fillCircle(laneNode.x, laneNode.y, LANE_NODE_RADIUS)
      })
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

        const trafficSignalStart = road.getPointAt(road.getLength())
        const trafficSignalEnd = road.getPointAt(road.getLength() - 5)

        this.graphics.lineBetween(
          trafficSignalStart.x,
          trafficSignalStart.y,
          trafficSignalEnd.x,
          trafficSignalEnd.y
        )
      }
    })
  }

  private drawLaneVehicles(lane: Lane) {
    lane.vehicles.forEach((vehicle, vehicleIndex) => {
      const vehicleGraphics = this.vehicleGraphics.get(vehicle)!
      vehicleGraphics.clear()

      const vehiclePosition = lane.getPointAt(vehicle.x)
      vehicleGraphics.x = vehiclePosition.x
      vehicleGraphics.y = vehiclePosition.y

      if (vehicle.acceleration < -0.001) {
        vehicleGraphics.fillStyle(0xff0000, 1)
      } else if (vehicle.acceleration > 0.001) {
        vehicleGraphics.fillStyle(0x00ff00, 1)
      } else {
        vehicleGraphics.fillStyle(0xffff00, 1)
      }

      if (this.selectedVehicle === vehicle) {
        vehicleGraphics.fillStyle(COLOR.PINK)
        this.vehicleStats.text = `Speed: ${vehicle.speed}\nMax speed: ${vehicle.maxSpeed}\nEngine max speed: ${vehicle.engineMaxSpeed}\nAcceleration: ${vehicle.acceleration}\nIndex on road: ${vehicleIndex}`
        this.drawPath(vehicle.path)
      }

      vehicleGraphics.fillRoundedRect(
        -vehicle.length / 2,
        -VEHICLE_WIDTH / 2,
        vehicle.length,
        VEHICLE_WIDTH,
        2
      )
      vehicleGraphics.rotation = lane.getAngleAt(vehicle.x)
    })
  }

  private drawVehicles() {
    // Draw vehicles

    /*
    TODO
    // Find the lead vehicle of the selected vehicle
    let leadVehicleDistance: {leadVehicle: Vehicle; distance: number} | null =
      null
    if (this.selectedVehicle) {
      // Find the index of the selected vehicle on his road.
      const lane = this.selectedVehicle.getCurrentLane()
      const vehicleIndex = lane!.vehicles.indexOf(this.selectedVehicle)


      leadVehicleDistance = this.simulation.findDistanceToLeadVehicle({
        path: this.selectedVehicle.path,
        currentRoadIndex: this.selectedVehicle.currentRoadIndex,
        vehicleIndex,
      })
    }
 */

    this.graphics.fillStyle(0xff0000, 1)
    this.simulation.roads.forEach((road) => {
      road.lanes.forEach((lane) => {
        this.drawLaneVehicles(lane)
      })
    })
    this.simulation.nodes.forEach((node) => {
      node.connectionLanes.forEach((lane) => {
        this.drawLaneVehicles(lane)
      })
    })
  }

  private setupCamera() {
    // TODO World size should come from the Simulation
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.cameraControls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: this.cameras.main,
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      speed: 0.5,

      zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      zoomSpeed: 0.02,
    })

    this.input.on('wheel', ({deltaY}: WheelEvent) => {
      if (deltaY > 0) {
        this.cameras.main.zoom -= 0.1
      }
      if (deltaY < 0) {
        this.cameras.main.zoom += 0.1
      }
    })
  }
}
