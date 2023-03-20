import Phaser from 'phaser'
import {ROAD_TYPES, Simulation} from '../simulation/Simulation'
import {GAME_HEIGHT, GAME_WIDTH} from '../constants'
import {CurvedRoad} from '../simulation/CurvedRoad'
import {Vehicle} from '../simulation/Vehicle'

const LANE_NODE_RADIUS = 3
const EDGE_WIDTH = 16
const VEHICLE_WIDTH = 6
const DEBUG = false

const COLOR = {
  ROAD: 0x666666,
  ROAD_NODE: 0x555555,
  LANE: 0xff0000,
  LANE_NODE: 0x00ff00,

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
  private cameraControls!: Phaser.Cameras.Controls.FixedKeyControl
  private buildMode: {
    type: string
    sourceLocation: {x: number; y: number} | null
    targetLocation: {x: number; y: number} | null
  } | null = null

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

    this.simulation.addStraightRoad(
      {x: 20, y: 50},
      {x: 500, y: 50},
      ROAD_TYPES.ONE_WAY
    )
    this.simulation.addStraightRoad(
      {x: 20, y: 50},
      {x: 20, y: 500},
      ROAD_TYPES.BASIC
    )
    this.simulation.addStraightRoad(
      {x: 20, y: 500},
      {x: 500, y: 50},
      ROAD_TYPES.LANES_8,
      {
        x: 500,
        y: 500,
      }
    )

    // Roundabout
    this.simulation.addStraightRoad(
      {x: 700, y: 450},
      {x: 800, y: 550},
      ROAD_TYPES.LANES_4,
      {
        x: 700,
        y: 550,
      }
    )
    this.simulation.addStraightRoad(
      {x: 800, y: 550},
      {x: 900, y: 450},
      ROAD_TYPES.LANES_4,
      {
        x: 900,
        y: 550,
      }
    )
    this.simulation.addStraightRoad(
      {x: 900, y: 450},
      {x: 800, y: 350},
      ROAD_TYPES.LANES_4,
      {
        x: 900,
        y: 350,
      }
    )
    this.simulation.addStraightRoad(
      {x: 800, y: 350},
      {x: 700, y: 450},
      ROAD_TYPES.LANES_4,
      {
        x: 700,
        y: 350,
      }
    )

    // Below roundabout
    this.simulation.addStraightRoad(
      {x: 800, y: 550},
      {x: 800, y: 650},
      ROAD_TYPES.BASIC
    )
    // Left of roundabout
    this.simulation.addStraightRoad(
      {x: 700, y: 450},
      {x: 600, y: 450},
      ROAD_TYPES.BASIC
    )
    // Connect the two
    this.simulation.addStraightRoad(
      {x: 800, y: 650},
      {x: 600, y: 450},
      ROAD_TYPES.LANES_8,
      {
        x: 600,
        y: 650,
      }
    )
    // Right of roundabout
    this.simulation.addStraightRoad(
      {x: 900, y: 450},
      {x: 1000, y: 450},
      ROAD_TYPES.BASIC
    )
    this.simulation.addStraightRoad(
      {x: 1000, y: 450},
      {x: 800, y: 650},
      ROAD_TYPES.BASIC
    )

    this.simulation.addStraightRoad(
      {x: 800, y: 650},
      {x: 800, y: 850},
      ROAD_TYPES.BASIC
    )

    this.simulation.addStraightRoad(
      {x: 800, y: 650},
      {x: 1000, y: 850},
      ROAD_TYPES.BASIC
    )

    this.simulation.addStraightRoad(
      {x: 800, y: 850},
      {x: 1000, y: 850},
      ROAD_TYPES.BASIC
    )

    this.simulation.addStraightRoad(
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

      // Are we building ?
      if (this.buildMode) {
        if (this.buildMode.type === 'road') {
          if (!this.buildMode.sourceLocation) {
            this.buildMode.sourceLocation = {x: click.x, y: click.y}
            return
          }
          if (!this.buildMode.targetLocation) {
            this.buildMode.targetLocation = {x: click.x, y: click.y}
            // Actually build it
          }
        }

        return
      }

      // Select the vehicle below the mouse.
      this.selectedVehicle = this.vehicleAt(click.x, click.y)
      if (this.selectedVehicle === null) {
        this.vehicleStats.text = 'Select a vehicle'
      }

      // Did the user select a node to spawn a new vehicle?
      if (this.input.keyboard.checkDown(shift)) {
        // Find the node closest to the pointer position
        /*

        const closestNode = closestNodeIndex(
          this.simulation.graph,
          click.x,
          click.y
        )
        if (closestNode !== null) {
          this.simulation.addVehicle(closestNode)
        }

         */
      }
    })

    this.input.keyboard.on('keydown-B', () => {
      if (this.buildMode) {
        // TODO Delete all the graphics linked to the build...
        this.buildMode = null
      } else {
        // Enter or leave build mode
        this.buildMode = {
          type: 'road',
          sourceLocation: null,
          targetLocation: null,
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

        const vehiclePosition = road.getPoint(vehicle.x)
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
        vehicleGraphics.rotation = road.getAngle(vehicle.x)
      })
    })

    this.drawTrafficSignals()
  }

  private vehicleAt(x: number, y: number): Vehicle | null {
    for (const road of this.simulation.roads) {
      for (const vehicle of road.vehicles) {
        const vehiclePosition = road.getPoint(vehicle.x)
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

  private drawPath(path: number[]) {
    this.graphics.lineStyle(1, COLOR.PINK)
    path.forEach((roadIndex) => {
      const road = this.simulation.roads[roadIndex]
      const startNode = road.source
      const endNode = road.target
      if (road instanceof CurvedRoad) {
        road.curve.draw(this.graphics)
      } else {
        this.graphics.lineBetween(
          startNode.x,
          startNode.y,
          endNode.x,
          endNode.y
        )
      }
    })
  }

  private drawRoads() {
    this.simulation.roads.forEach((road) => {
      const startNode = road.source
      const endNode = road.target

      this.graphics.lineStyle(road.getWidth(), COLOR.ROAD, 1)

      if (road instanceof CurvedRoad) {
        road.curve.draw(this.graphics)
      } else {
        this.graphics.lineBetween(
          startNode.x,
          startNode.y,
          endNode.x,
          endNode.y
        )
      }
    })
  }

  private drawRoadNodes() {
    this.graphics.fillStyle(COLOR.ROAD_NODE, 0.4)
    this.simulation.nodes.forEach((node) => {
      this.graphics.fillCircle(node.x, node.y, node.size())
    })
  }

  private drawLanes() {
    this.graphics.lineStyle(1, COLOR.LANE, 1)
    this.simulation.roads.forEach((road) => {
      road.lanes.forEach((lane) => {
        if (lane.curve) {
          lane.curve.draw(this.graphics)
        } else {
          const startNode = lane.source
          const endNode = lane.target
          this.graphics.lineBetween(
            startNode.x,
            startNode.y,
            endNode.x,
            endNode.y
          )
        }
      })
    })
  }

  private drawLaneConnections() {
    this.graphics.lineStyle(1, 0x00ff00, 1)
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

        const trafficSignalStart = road.getPoint(road.getLength())
        const trafficSignalEnd = road.getPoint(road.getLength() - 5)

        this.graphics.lineBetween(
          trafficSignalStart.x,
          trafficSignalStart.y,
          trafficSignalEnd.x,
          trafficSignalEnd.y
        )
      }
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
