import Phaser from 'phaser'
import {Coordinates} from '../types'

export interface ICurve<N extends Coordinates> {
  source: N
  target: N
  getLength(): number

  getPointAt(positionOnCurve: number): Coordinates
  getTangentAt(positionOnCurve: number): Coordinates
  getTangentAtSource(): Coordinates
  getTangentAtTarget(): Coordinates
  getAngleAt(positionOnCurve: number): number
  curve: Phaser.Curves.Curve
}

export class Curve<N extends Coordinates> implements ICurve<N> {
  constructor(
    public readonly source: N,
    public readonly target: N,
    public readonly curve: Phaser.Curves.Curve
  ) {}

  getLength(): number {
    return this.curve.getLength()
  }

  getPointAt(positionOnCurve: number): Coordinates {
    return this.curve.getPointAt(positionOnCurve)
  }

  getTangentAt(positionOnCurve: number): Coordinates {
    return this.curve.getTangentAt(positionOnCurve)
  }

  getAngleAt(positionOnCurve: number): number {
    return this.curve.getTangentAt(positionOnCurve).angle()
  }

  getTangentAtSource(): Coordinates {
    return this.curve.getTangentAt(0)
  }

  getTangentAtTarget(): Coordinates {
    return this.curve.getTangentAt(1)
  }
}
