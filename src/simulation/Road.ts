import {TrafficSignal} from '../TrafficSignal'
import {Node} from '../types'
import {Vehicle} from './Vehicle'

export abstract class Road {
  // List of vehicles on the road. Ordered by distance on the road DESC.
  public vehicles: Vehicle[] = []
  public trafficSignal: TrafficSignal | null = null
  public trafficSignalGroupIndex: number | null = null

  protected constructor(public source: Node, public target: Node) {}

  abstract getLength(): number

  abstract getPoint(positionOnRoad: number): {x: number; y: number}

  abstract getAngle(positionOnRoad: number): number

  setTrafficSignal(signal: TrafficSignal, groupIndex: number) {
    this.trafficSignal = signal
    this.trafficSignalGroupIndex = groupIndex
  }

  redLight(): boolean {
    if (this.trafficSignal) {
      return this.trafficSignal.isGroupStopped(this.trafficSignalGroupIndex!)
    }
    return false
  }

  protected assertValidPositionOnRoad(positionOnRoad: number): void {
    if (positionOnRoad < 0 || positionOnRoad > this.getLength()) {
      throw new Error('Invalid location on road')
    }
  }
}
