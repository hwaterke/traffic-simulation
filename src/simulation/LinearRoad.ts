import {Node} from '../types'
import {Road} from './Road'

export class LinearRoad extends Road {
  protected length: number
  private readonly angleSin: number
  private readonly angleCos: number
  private readonly angle: number

  constructor(public source: Node, public target: Node) {
    super(source, target)

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

  getLength() {
    return this.length
  }

  getPoint(positionOnRoad: number) {
    this.assertValidPositionOnRoad(positionOnRoad)
    return {
      x: this.source.x + positionOnRoad * this.angleCos,
      y: this.source.y + positionOnRoad * this.angleSin,
    }
  }

  getAngle(positionOnRoad: number): number {
    this.assertValidPositionOnRoad(positionOnRoad)
    return this.angle
  }
}
