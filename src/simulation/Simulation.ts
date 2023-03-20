import {Coordinates, LaneNode, RoadType} from '../types'
import {TrafficSignal} from '../TrafficSignal'
import {Vehicle} from './Vehicle'
import {Road} from './Road'
import {
  getDistance,
  getParallelCurvePoints,
  getParallelLinePoints,
  hermiteToBezier,
  shortenCurveSegment,
  shortenLineSegment,
} from '../utils'
import Phaser from 'phaser'
import {Curve} from './Curve'

export const ROAD_TYPES = {
  ONE_WAY: {
    lanes: [{offset: 0, isReversed: false}],
  },
  BASIC: {
    lanes: [
      {offset: 4, isReversed: false},
      {offset: -4, isReversed: true},
    ],
  },
  LANES_4: {
    lanes: [
      {offset: 4, isReversed: false},
      {offset: 8, isReversed: false},
      {offset: -4, isReversed: true},
      {offset: -8, isReversed: true},
    ],
  },
  LANES_6: {
    lanes: [
      {offset: 4, isReversed: false},
      {offset: 8, isReversed: false},
      {offset: 12, isReversed: false},
      {offset: -4, isReversed: true},
      {offset: -8, isReversed: true},
      {offset: -12, isReversed: true},
    ],
  },
  LANES_8: {
    lanes: [
      {offset: 4, isReversed: false},
      {offset: 8, isReversed: false},
      {offset: 12, isReversed: false},
      {offset: 16, isReversed: false},
      {offset: -4, isReversed: true},
      {offset: -8, isReversed: true},
      {offset: -12, isReversed: true},
      {offset: -16, isReversed: true},
    ],
  },
} as const satisfies Record<string, RoadType>

type SimulationOptions = {
  onVehicleAdded: (vehicle: Vehicle) => void
  onVehicleRemoved: (vehicle: Vehicle) => void
}

export class Lane extends Curve<LaneNode> {
  public vehicles: Vehicle[] = []
}

export class RoadNode implements Coordinates {
  private _size = 0
  public readonly outgoingRoads: Set<Road> = new Set()
  public readonly incomingRoads: Set<Road> = new Set()
  public readonly connectionLanes: Lane[] = []

  constructor(public x: number, public y: number) {}

  size() {
    return this._size
  }

  addRoad(road: Road) {
    if (road.source === this) {
      this.outgoingRoads.add(road)
    }
    if (road.target === this) {
      this.incomingRoads.add(road)
    }
    this._size = Math.max(this._size, road.getWidth())
  }

  getIncomingLanes(): Lane[] {
    const lanes: Lane[] = []

    this.outgoingRoads.forEach((outgoingRoad) => {
      lanes.push(
        ...outgoingRoad.lanes.filter(
          (_, index) => outgoingRoad.type.lanes[index].isReversed
        )
      )
    })
    this.incomingRoads.forEach((incomingRoad) => {
      lanes.push(
        ...incomingRoad.lanes.filter(
          (_, index) => !incomingRoad.type.lanes[index].isReversed
        )
      )
    })

    return lanes
  }

  getOutgoingLanes(): Lane[] {
    const lanes: Lane[] = []

    this.outgoingRoads.forEach((outgoingRoad) => {
      lanes.push(
        ...outgoingRoad.lanes.filter(
          (_, index) => !outgoingRoad.type.lanes[index].isReversed
        )
      )
    })
    this.incomingRoads.forEach((incomingRoad) => {
      lanes.push(
        ...incomingRoad.lanes.filter(
          (_, index) => incomingRoad.type.lanes[index].isReversed
        )
      )
    })

    return lanes
  }

  getIncomingLaneNode(): LaneNode[] {
    // TODO use getIncomingLanes()
    const nodes: LaneNode[] = []

    this.outgoingRoads.forEach((outgoingRoad) => {
      nodes.push(
        ...outgoingRoad.lanes
          .filter((_, index) => outgoingRoad.type.lanes[index].isReversed)
          .map((lane) => lane.target)
      )
    })
    this.incomingRoads.forEach((incomingRoad) => {
      nodes.push(
        ...incomingRoad.lanes
          .filter((_, index) => !incomingRoad.type.lanes[index].isReversed)
          .map((lane) => lane.target)
      )
    })

    return nodes
  }

  getOutgoingLaneNode(): LaneNode[] {
    // TODO use getOutgoingLanes()
    const nodes: LaneNode[] = []

    this.outgoingRoads.forEach((outgoingRoad) => {
      nodes.push(
        ...outgoingRoad.lanes
          .filter((_, index) => !outgoingRoad.type.lanes[index].isReversed)
          .map((lane) => lane.source)
      )
    })
    this.incomingRoads.forEach((incomingRoad) => {
      nodes.push(
        ...incomingRoad.lanes
          .filter((_, index) => incomingRoad.type.lanes[index].isReversed)
          .map((lane) => lane.source)
      )
    })

    return nodes
  }
}

export class Simulation {
  roads: Road[] = []
  nodes: RoadNode[] = []

  laneNodes: LaneNode[] = []

  trafficSignals: TrafficSignal[] = []

  constructor(private options: SimulationOptions) {}

  tick() {
    /*
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

     */

    this.trafficSignals.forEach((trafficSignal) => {
      trafficSignal.update()
    })
  }

  // Add a vehicle on a road.
  addVehicle(sourceNode: number | null) {
    /*
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

     */
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

  addStraightRoad(
    source: Coordinates,
    target: Coordinates,
    type: RoadType,
    controlCoordinates?: Coordinates
  ) {
    // TODO Improvement: Find out if we need to reuse an existing nodes or create one along a road.
    // TODO Improvement: Prevent creation if a road already exists between the two nodes.
    // TODO Improvement: Prevent u turns in some situation

    // Find or create the two RoadNode
    const sourceNode = this.findOrCreateNodeAt(source, 10)
    const targetNode = this.findOrCreateNodeAt(target, 10)

    // Create the new Road between the two nodes.
    const road = controlCoordinates
      ? new Road(
          sourceNode,
          targetNode,
          new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(sourceNode.x, sourceNode.y),
            new Phaser.Math.Vector2(controlCoordinates.x, controlCoordinates.y),
            new Phaser.Math.Vector2(targetNode.x, targetNode.y)
          ),
          type
        )
      : new Road(
          sourceNode,
          targetNode,
          new Phaser.Curves.Line(
            new Phaser.Math.Vector2(sourceNode.x, sourceNode.y),
            new Phaser.Math.Vector2(targetNode.x, targetNode.y)
          ),
          type
        )
    this.roads.push(road)

    // Let the RoadNode know about this new Road
    sourceNode.addRoad(road)
    targetNode.addRoad(road)

    // Create the new LaneNode and the new Lanes (add the lanes to the Road)
    road.type.lanes.forEach((laneDefinition) => {
      const laneNodeAtSourceRoadNode = {x: sourceNode.x, y: sourceNode.y}
      const laneNodeAtTargetRoadNode = {x: targetNode.x, y: targetNode.y}

      this.laneNodes.push(laneNodeAtSourceRoadNode, laneNodeAtTargetRoadNode)

      const laneSource = laneDefinition.isReversed
        ? laneNodeAtTargetRoadNode
        : laneNodeAtSourceRoadNode
      const laneTarget = laneDefinition.isReversed
        ? laneNodeAtSourceRoadNode
        : laneNodeAtTargetRoadNode

      const lane: Lane = controlCoordinates
        ? new Lane(
            laneSource,
            laneTarget,
            new Phaser.Curves.QuadraticBezier(
              new Phaser.Math.Vector2(laneSource.x, laneSource.y),
              new Phaser.Math.Vector2(
                controlCoordinates.x,
                controlCoordinates.y
              ),
              new Phaser.Math.Vector2(laneTarget.x, laneTarget.y)
            )
          )
        : new Lane(
            laneSource,
            laneTarget,
            new Phaser.Curves.Line(
              new Phaser.Math.Vector2(laneSource.x, laneSource.y),
              new Phaser.Math.Vector2(laneTarget.x, laneTarget.y)
            )
          )

      road.lanes.push(lane)
    })

    this.updateLaneNodePositions(road.source)
    this.updateLaneNodePositions(road.target)

    // TODO Recompute all the lane connections for each RoadNode
    // TODO It should be recomputed when lane node are moved.

    function generateConnectionLane(node: RoadNode) {
      const incomingLanes = node.getIncomingLanes()
      const outgoingLanes = node.getOutgoingLanes()

      incomingLanes.forEach((incomingLane) => {
        outgoingLanes.forEach((outgoingLane) => {
          const incomingNode = incomingLane.target
          const outgoingNode = outgoingLane.source

          if (
            !sourceNode.connectionLanes.some((lane) => {
              return (
                lane.source === incomingNode && lane.target === outgoingNode
              )
            })
          ) {
            // Add the connection
            // TODO improve
            const incomingTangent = incomingLane.getTangentAtTarget()
            const outgoingTangent = outgoingLane.getTangentAtSource()

            const result = hermiteToBezier(
              incomingNode,
              outgoingNode,
              incomingTangent,
              outgoingTangent
            )

            node.connectionLanes.push(
              new Lane(
                incomingNode,
                outgoingNode,
                new Phaser.Curves.CubicBezier(
                  new Phaser.Math.Vector2(incomingNode.x, incomingNode.y),
                  new Phaser.Math.Vector2(result[0].x, result[0].y),
                  new Phaser.Math.Vector2(result[1].x, result[1].y),
                  new Phaser.Math.Vector2(outgoingNode.x, outgoingNode.y)
                )
              )
            )
          }
        })
      })
    }

    // TODO what an ugly way to empty the array
    sourceNode.connectionLanes.splice(0, sourceNode.connectionLanes.length)
    generateConnectionLane(sourceNode)
    targetNode.connectionLanes.splice(0, targetNode.connectionLanes.length)
    generateConnectionLane(targetNode)
  }

  private findNodeAt(
    coordinates: Coordinates,
    thresholdDistance: number
  ): RoadNode | null {
    for (const node of this.nodes) {
      if (getDistance(coordinates, node) < thresholdDistance) {
        return node
      }
    }
    return null
  }

  private findOrCreateNodeAt(
    coordinates: Coordinates,
    thresholdDistance: number
  ): RoadNode {
    const node = this.findNodeAt(coordinates, thresholdDistance)
    if (node !== null) {
      return node
    }

    const newNode = new RoadNode(coordinates.x, coordinates.y)
    this.nodes.push(newNode)
    return newNode
  }

  private lanesFrom(node: LaneNode): Lane[] {
    // TODO Improve internal data structure to get this in O(1)
    const result: Lane[] = []
    result.push(
      ...this.roads.flatMap((road) => {
        return road.lanes.filter((lane) => lane.source == node)
      })
    )
    result.push(
      ...this.nodes.flatMap((roadNode) => {
        return roadNode.connectionLanes.filter((lane) => lane.source === node)
      })
    )
    return result
  }

  private findPath(source: RoadNode, target: RoadNode): Lane[] | null {
    // Get the outgoing lanes nodes !

    // Need a way to find next lanes !
    // Path will be a path of lanes to follow !

    // Dijkstra from any outgoing lane to the target node (incoming lane node)

    return null
  }

  /**
   * Recompute the position of all the LaneNode that have this RoadNode as source or target
   */
  private updateLaneNodePositions(node: RoadNode) {
    node.outgoingRoads.forEach((road) => {
      this.updateRoadLaneNodePositions(road)
    })
    node.incomingRoads.forEach((road) => {
      this.updateRoadLaneNodePositions(road)
    })
  }

  private updateRoadLaneNodePositions(road: Road) {
    road.type.lanes.forEach((laneDefinition, index) => {
      const lane = road.lanes[index]

      if (
        road.curve instanceof Phaser.Curves.QuadraticBezier &&
        lane.curve instanceof Phaser.Curves.QuadraticBezier
      ) {
        const parallel = getParallelCurvePoints(
          road.source,
          road.target,
          road.curve.p1,
          laneDefinition.offset
        )

        const newCurve = shortenCurveSegment(
          parallel.source,
          parallel.control,
          parallel.target,
          road.source.size(),
          road.target.size()
        )

        new Phaser.Curves.Spline()

        lane.source.x = lane.curve!.p0.x = laneDefinition.isReversed
          ? newCurve.target.x
          : newCurve.source.x
        lane.source.y = lane.curve!.p0.y = laneDefinition.isReversed
          ? newCurve.target.y
          : newCurve.source.y

        lane.curve!.p1.x = newCurve.control.x
        lane.curve!.p1.y = newCurve.control.y

        lane.target.x = lane.curve!.p2.x = laneDefinition.isReversed
          ? newCurve.source.x
          : newCurve.target.x
        lane.target.y = lane.curve!.p2.y = laneDefinition.isReversed
          ? newCurve.source.y
          : newCurve.target.y
        // TODO clean up this . And shorten the line also
      } else if (lane.curve instanceof Phaser.Curves.Line) {
        // Shift the line by offset of the lane
        const {source, target} = getParallelLinePoints(
          road.source,
          road.target,
          laneDefinition.offset
        )

        // Shorten the line based on the size of the nodes
        const shortened = shortenLineSegment(
          source,
          target,
          road.source.size(),
          road.target.size()
        )

        // Update the lane nodes
        lane.source.x = lane.curve.p0.x = laneDefinition.isReversed
          ? shortened.target.x
          : shortened.source.x
        lane.source.y = lane.curve.p0.y = laneDefinition.isReversed
          ? shortened.target.y
          : shortened.source.y

        lane.target.x = lane.curve.p1.x = laneDefinition.isReversed
          ? shortened.source.x
          : shortened.target.x
        lane.target.y = lane.curve.p1.y = laneDefinition.isReversed
          ? shortened.source.y
          : shortened.target.y
      }
    })
  }
}
