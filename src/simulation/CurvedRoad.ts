import {Road} from './Road'
import {RoadType} from '../types'
import Phaser from 'phaser'
import {RoadNode} from './Simulation'

export class CurvedRoad extends Road {
  public readonly curve: Phaser.Curves.QuadraticBezier
  private readonly length: number

  constructor(
    public source: RoadNode,
    public target: RoadNode,
    control: [number, number],
    type: RoadType
  ) {
    super(source, target, type)

    this.curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(source.x, source.y),
      new Phaser.Math.Vector2(control[0], control[1]),
      new Phaser.Math.Vector2(target.x, target.y)
    )

    this.length = this.curve.getLength()
  }

  getPoint(positionOnRoad: number) {
    this.assertValidPositionOnRoad(positionOnRoad)
    return this.curve.getPointAt(positionOnRoad / this.getLength())
  }

  getAngle(positionOnRoad: number) {
    this.assertValidPositionOnRoad(positionOnRoad)
    const tangent = this.curve.getTangentAt(positionOnRoad / this.getLength())
    return tangent.angle()
  }

  getLength(): number {
    return this.length
  }
}
