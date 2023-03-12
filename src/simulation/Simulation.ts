import {Graph} from '../types'
import {dijkstra} from '../pathfinding'
import {TrafficSignal} from '../TrafficSignal'
import {Vehicle} from './Vehicle'
import {Road} from './Road'
import {CurvedRoad} from './CurvedRoad'
import {LinearRoad} from './LinearRoad'

type SimulationOptions = {
  onVehicleAdded: (vehicle: Vehicle) => void
  onVehicleRemoved: (vehicle: Vehicle) => void
}

export class Simulation {
  roads: Road[] = []
  trafficSignals: TrafficSignal[] = []

  constructor(public graph: Graph, private options: SimulationOptions) {
    // Build Roads
    this.roads = this.graph.edges.map((edge) => {
      if (edge.curvedControl !== undefined) {
        return new CurvedRoad(
          graph.nodes[edge.source],
          graph.nodes[edge.target],
          edge.curvedControl
        )
      }
      return new LinearRoad(graph.nodes[edge.source], graph.nodes[edge.target])
    })
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

        // For the first vehicle check if the traffic signal is there and red
        if (index === 0) {
          if (road.redLight()) {
            // In the stop zone ?
            if (
              vehicle.x >=
              road.getLength() - road.trafficSignal!.stopDistance
            ) {
              vehicle.shouldStop = true
            } else if (
              vehicle.x >=
              road.getLength() - road.trafficSignal!.slowDistance
            ) {
              vehicle.maxSpeed = 6 // Max speed of 15 in slow zone
            }
          } else {
            vehicle.maxSpeed = vehicle.engineMaxSpeed // No need to slow down
            vehicle.shouldStop = false
          }
        } else {
          // Make sure no vehicles are slowed down
          vehicle.maxSpeed = vehicle.engineMaxSpeed
          vehicle.shouldStop = false
        }
      })

      // Make sure the first vehicle is not at the end of the road
      if (road.vehicles.length > 0) {
        const leadVehicle = road.vehicles[0]
        if (leadVehicle.x > road.getLength()) {
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

    this.trafficSignals.forEach((trafficSignal) => {
      trafficSignal.update()
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
      distanceToVehicle += road.getLength()
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
      const distanceToEndOfRoute = road.getLength() - vehicle.x

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

  addTrafficSignals(roadGroups: number[][]) {
    const signals = new TrafficSignal(roadGroups.length)
    this.trafficSignals.push(signals)
    roadGroups.forEach((roadGround, groupIndex) => {
      roadGround.forEach((roadIndex) => {
        const road = this.roads[roadIndex]
        road.setTrafficSignal(signals, groupIndex)
      })
    })
  }
}
