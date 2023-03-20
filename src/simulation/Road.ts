import {TrafficSignal} from '../TrafficSignal'
import {RoadType} from '../types'
import {Lane, RoadNode} from './Simulation'
import {Curve} from './Curve'
import Phaser from 'phaser'

export class Road extends Curve<RoadNode> {
  public lanes: Lane[] = []
  public trafficSignal: TrafficSignal | null = null
  public trafficSignalGroupIndex: number | null = null

  constructor(
    source: RoadNode,
    target: RoadNode,
    curve: Phaser.Curves.Curve,
    public readonly type: RoadType
  ) {
    super(source, target, curve)
  }

  getWidth() {
    return (
      2 *
        Math.max(
          ...this.type.lanes.map((laneDefinition) =>
            Math.abs(laneDefinition.offset)
          )
        ) +
      4
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
