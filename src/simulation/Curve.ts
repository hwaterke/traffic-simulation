import Phaser from 'phaser'
import {Coordinates} from '../types'

export interface Curve<N extends Coordinates> {
  source: N
  target: N
  getLength(): number

  getPointAt(positionOnCurve: number): Coordinates
  getTangentAt(positionOnCurve: number): Coordinates
  getTangentAtSource(): Coordinates
  getTangentAtTarget(): Coordinates

  shiftRight(distance: number): Curve<N>
  trim(distanceFromStart: number, distanceFromEnd: number): Curve<N>

  curve: Phaser.Curves.Curve
}

abstract class BaseCurve<N extends Coordinates> implements Curve<N> {
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

  getTangentAtSource(): Coordinates {
    return this.curve.getTangentAt(0)
  }

  getTangentAtTarget(): Coordinates {
    return this.curve.getTangentAt(1)
  }

  abstract shiftRight(distance: number): Curve<N>

  abstract trim(distanceFromStart: number, distanceFromEnd: number): Curve<N>
}

export class StraightCurve<N extends Coordinates> extends BaseCurve<N> {
  shiftRight(distance: number): Curve<N> {
    // TODO Implement
    return this
  }

  trim(distanceFromStart: number, distanceFromEnd: number): Curve<N> {
    // TODO Implement
    return this
  }
}

export class QuadraticBezierCurve<N extends Coordinates> extends BaseCurve<N> {
  shiftRight(distance: number): Curve<N> {
    // TODO Implement
    return this
  }

  trim(distanceFromStart: number, distanceFromEnd: number): Curve<N> {
    // TODO Implement
    return this
  }
}
