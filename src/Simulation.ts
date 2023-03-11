import {Graph, Node} from './types'
import {dijkstra} from './pathfinding'

export class Road {
  // List of vehicles on the road. Ordered by distance on the road DESC.
  public vehicles: Vehicle[]
  public readonly length: number
  public readonly angleSin: number
  public readonly angleCos: number
  public readonly angle: number

  constructor(public source: Node, public target: Node) {
    this.vehicles = []
    this.length = Phaser.Math.Distance.Between(
      source.x,
      source.y,
      target.x,
      target.y
    )
    this.angleSin = (target.y - source.y) / this.length
    this.angleCos = (target.x - source.x) / this.length
    this.angle = Phaser.Math.Angle.Between(
      source.x,
      source.y,
      target.x,
      target.y
    )
  }
}

export class Vehicle {
  public x = 0 // Position along its current road (0 to road length)
  public speed = 0
  public acceleration = 0

  public path: number[] = [] // List of road indexes
  public currentRoadIndex = 0

  public readonly length = 10 + Math.random() * 10 // Length of the vehicle
  public readonly maxSpeed = Math.floor(6 + Math.random() * 40)
  public readonly maxAcceleration = 1.44 + Math.random() * 1.5
  public readonly maxDeceleration = 4.61
  public readonly desiredDistanceFromLeadVehicle = 4
  public driverReactionTime = 1

  tick({
    leadVehicle,
    distanceToLeadVehicle,
  }: {
    leadVehicle: Vehicle | null
    distanceToLeadVehicle: number | null
  }) {
    const DT = 1 / 60

    // Update position and velocity
    if (this.speed + this.acceleration * DT < 0) {
      this.x -= 0.5 * this.speed * this.speed * this.acceleration
      this.speed = 0
    } else {
      this.speed += this.acceleration * DT
      this.x += this.speed * DT + (this.acceleration * DT * DT) / 2
    }

    // Update the acceleration
    let alpha = 0

    if (leadVehicle && distanceToLeadVehicle) {
      const speedDifference = this.speed - leadVehicle.speed

      if (distanceToLeadVehicle <= 0) {
        console.log('Vehicle crashed')
        // Vehicle crashed into each other.
        this.speed = 0
        this.acceleration = 0
        return
      }

      const sqrt = 2 * Math.sqrt(this.maxAcceleration * this.maxDeceleration)

      alpha =
        (this.desiredDistanceFromLeadVehicle +
          Math.max(
            0,
            this.driverReactionTime * this.speed +
              (speedDifference * this.speed) / sqrt
          )) /
        distanceToLeadVehicle
    }

    this.acceleration =
      this.maxAcceleration *
      (1 - Math.pow(this.speed / this.maxSpeed, 4) - Math.pow(alpha, 2))
  }
}

type SimulationOptions = {
  onVehicleAdded: (vehicle: Vehicle) => void
  onVehicleRemoved: (vehicle: Vehicle) => void
}

export class Simulation {
  roads: Road[] = []

  constructor(public graph: Graph, private options: SimulationOptions) {
    // Build Roads
    this.roads = this.graph.edges.map(
      (edge) => new Road(graph.nodes[edge.source], graph.nodes[edge.target])
    )
  }

  update(time: number, delta: number) {
    // TODO call tick as many times as needed to maintain simulation speed
    this.tick()
  }

  tick() {
    // Update position of each vehicle within each route
    this.roads.forEach((road) => {
      // Move vehicles along the road
      road.vehicles.forEach((vehicle, index) => {
        const leadVehicle = this.findDistanceToLeadVehicle({
          path: vehicle.path,
          currentRoadIndex: vehicle.currentRoadIndex,
          vehicleIndex: index,
        })

        if (leadVehicle === null) {
          vehicle.tick({leadVehicle: null, distanceToLeadVehicle: null})
        } else {
          vehicle.tick({
            leadVehicle: leadVehicle.leadVehicle,
            distanceToLeadVehicle: leadVehicle.distance,
          })
        }
      })

      // Make sure the first vehicle is not at the end of the road
      if (road.vehicles.length > 0) {
        const leadVehicle = road.vehicles[0]
        if (leadVehicle.x > road.length) {
          // Move the vehicle to the next road
          leadVehicle.x = 0
          leadVehicle.currentRoadIndex++

          // Remove the vehicle from the current road
          road.vehicles.shift()

          if (leadVehicle.currentRoadIndex < leadVehicle.path.length) {
            // Add the vehicle to the next road
            const nextRoad =
              this.roads[leadVehicle.path[leadVehicle.currentRoadIndex]]
            nextRoad.vehicles.push(leadVehicle)
          } else {
            this.options.onVehicleRemoved(leadVehicle)
          }
        }
      }
    })
  }

  // Add a vehicle on a road.
  addVehicle(sourceNode: number | null) {
    const sourceNodeIndex =
      sourceNode ?? Math.floor(Math.random() * this.graph.nodes.length)
    const targetNodeIndex = Math.floor(Math.random() * this.graph.nodes.length)

    const path = dijkstra(this.graph, sourceNodeIndex, targetNodeIndex)

    if (path && path.length > 0) {
      const road = this.roads[path[0]]
      const v = new Vehicle()

      // Do we have space to spawn a vehicle on this road?
      const firstVehicle = this.findFirstVehicle({
        path,
        currentRoadIndex: 0,
      })

      if (
        firstVehicle === null ||
        v.length / 2 <
          firstVehicle.distanceToVehicle - firstVehicle.vehicle.length / 2
      ) {
        v.path = path
        road.vehicles.push(v)
        this.options.onVehicleAdded(v)
        console.log('Vehicle added', {sourceNodeIndex, path})
        return true
      }
    }
    return false
  }

  // Finds the first vehicle on the provided path.
  findFirstVehicle({
    path,
    currentRoadIndex,
  }: {
    path: number[]
    currentRoadIndex: number
  }): {
    road: Road
    vehicle: Vehicle
    distanceToVehicle: number
  } | null {
    let distanceToVehicle = 0

    while (currentRoadIndex < path.length) {
      const road = this.roads[path[currentRoadIndex]]
      if (road.vehicles.length > 0) {
        const firstVehicle = road.vehicles[road.vehicles.length - 1]

        return {
          distanceToVehicle: distanceToVehicle + firstVehicle.x,
          road,
          vehicle: firstVehicle,
        }
      }
      distanceToVehicle += road.length
      currentRoadIndex++
    }

    return null
  }

  findDistanceToLeadVehicle({
    path,
    currentRoadIndex,
    vehicleIndex,
  }: {
    path: number[]
    currentRoadIndex: number
    vehicleIndex: number
  }): {
    leadVehicle: Vehicle
    distance: number
  } | null {
    const road = this.roads[path[currentRoadIndex]]
    const vehicle = road.vehicles[vehicleIndex]

    if (vehicleIndex > 0) {
      const leadVehicle = road.vehicles[vehicleIndex - 1]
      return {
        leadVehicle,
        distance:
          leadVehicle.x -
          leadVehicle.length / 2 -
          vehicle.x -
          vehicle.length / 2,
      }
    }

    // First vehicle on its road.
    const leadVehicle = this.findFirstVehicle({
      path,
      currentRoadIndex: currentRoadIndex + 1,
    })

    if (leadVehicle) {
      const distanceToEndOfRoute = road.length - vehicle.x

      return {
        leadVehicle: leadVehicle.vehicle,
        distance:
          distanceToEndOfRoute +
          leadVehicle.distanceToVehicle -
          leadVehicle.vehicle.length / 2 -
          vehicle.length / 2,
      }
    }

    return null
  }
}
