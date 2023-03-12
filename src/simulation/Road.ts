import {TrafficSignal} from '../TrafficSignal'
import {Node} from '../types'
import {Vehicle} from './Vehicle'

export class Road {
  // List of vehicles on the road. Ordered by distance on the road DESC.
  public vehicles: Vehicle[]
  public readonly length: number
  public readonly angleSin: number
  public readonly angleCos: number
  public readonly angle: number
  public trafficSignal: TrafficSignal | null = null
  public trafficSignalGroupIndex: number | null = null

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
}
