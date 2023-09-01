import Phaser from 'phaser'
import {getParallelCurvePoints} from '../utils'
import {Coordinates} from '../types'

type Point = {
  x: number
  y: number
}

function splitQuadraticBezierCurve(
  p0: Point,
  p1: Point,
  p2: Point,
  t: number
): [Point[], Point[]] {
  const q0: Point = {
    x: p0.x + t * (p1.x - p0.x),
    y: p0.y + t * (p1.y - p0.y),
  }
  const q1: Point = {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  }
  const r: Point = {
    x: q0.x + t * (q1.x - q0.x),
    y: q0.y + t * (q1.y - q0.y),
  }
  return [
    [p0, q0, r],
    [r, q1, p2],
  ]
}

function quadraticBezierRightEdge(
  p0: Point,
  p1: Point,
  p2: Point,
  lineWidth: number
): [Point, Point, Point] {
  // calculate tangent vectors at each point on the curve
  const t0: Point = {x: p1.x - p0.x, y: p1.y - p0.y}
  const t2: Point = {x: p2.x - p1.x, y: p2.y - p1.y}

  // normalize tangent vectors
  const t0len = Math.sqrt(t0.x * t0.x + t0.y * t0.y)
  const t2len = Math.sqrt(t2.x * t2.x + t2.y * t2.y)
  const t0n: Point = {x: t0.x / t0len, y: t0.y / t0len}
  const t2n: Point = {x: t2.x / t2len, y: t2.y / t2len}

  // calculate normal vectors by rotating tangent vectors 90 degrees clockwise
  const n0: Point = {x: t0n.y, y: -t0n.x}
  const n2: Point = {x: t2n.y, y: -t2n.x}

  // calculate new points offset by half the line width on the right-hand side
  const r0: Point = {
    x: p0.x + (n0.x * lineWidth) / 2,
    y: p0.y + (n0.y * lineWidth) / 2,
  }
  const r1: Point = {
    x: p1.x + (n0.x * lineWidth) / 2 + (n2.x * lineWidth) / 2,
    y: p1.y + (n0.y * lineWidth) / 2 + (n2.y * lineWidth) / 2,
  }
  const r2: Point = {
    x: p2.x + (n2.x * lineWidth) / 2,
    y: p2.y + (n2.y * lineWidth) / 2,
  }

  return [r0, r1, r2]
}

function getOffsetCurve(points: Point[], distance: number): Point[] {
  const offsetPoints: Point[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]

    // calculate tangent vector
    const tangent = {x: p1.x - p0.x, y: p1.y - p0.y}

    // normalize tangent vector
    const length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y)
    const normalizedTangent = {x: tangent.x / length, y: tangent.y / length}

    // calculate normal vector by rotating tangent vector 90 degrees clockwise
    const normal = {x: normalizedTangent.y, y: -normalizedTangent.x}

    // calculate offset points
    const offsetP0 = {
      x: p0.x + normal.x * distance,
      y: p0.y + normal.y * distance,
    }
    const offsetP1 = {
      x: p1.x + normal.x * distance,
      y: p1.y + normal.y * distance,
    }

    if (i === 0) {
      // add first point to offset curve
      offsetPoints.push(offsetP0)
    }

    // add second point to offset curve
    offsetPoints.push(offsetP1)

    if (i === points.length - 2) {
      // add last point to offset curve
      offsetPoints.push(offsetP1)
    }
  }

  return offsetPoints
}

export class DebugScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics

  drawBezier(
    source: Coordinates,
    control: Coordinates,
    target: Coordinates,
    color: number,
    lineWidth: number = 1
  ) {
    const startVector = new Phaser.Math.Vector2(source.x, source.y)
    const controlVector = new Phaser.Math.Vector2(control.x, control.y)
    const endVector = new Phaser.Math.Vector2(target.x, target.y)
    const bezier = new Phaser.Curves.QuadraticBezier(
      startVector,
      controlVector,
      endVector
    )
    this.graphics.lineStyle(lineWidth, color)
    bezier.draw(this.graphics)

    // Draw points
    this.graphics.fillStyle(color)
    this.graphics.fillCircle(source.x, source.y, 3)
    this.graphics.fillCircle(control.x, control.y, 3)
    this.graphics.fillCircle(target.x, target.y, 3)
  }

  create() {
    this.graphics = this.add.graphics()

    // Bezier

    const start = new Phaser.Math.Vector2(50, 500)
    const end = new Phaser.Math.Vector2(500, 50)
    const control = new Phaser.Math.Vector2(500, 500)
    const bezier = new Phaser.Curves.QuadraticBezier(start, control, end)
    this.graphics.lineStyle(40, 0x888888)
    bezier.draw(this.graphics)
    this.graphics.lineStyle(1, 0x00ff00)
    bezier.draw(this.graphics)

    // New technique
    const result = quadraticBezierRightEdge(start, control, end, 40)
    this.drawBezier(result[0], result[1], result[2], 0xff0000)

    // Old technique
    const result2 = getParallelCurvePoints(start, end, control, -20)
    this.drawBezier(result2.source, result2.control, result2.target, 0xff0000)

    const p0 = {x: 1000, y: 450}
    const p1 = {x: 1400, y: 850}
    const p2 = {x: 1000, y: 850}
    this.drawBezier(p0, p1, p2, 0x888888, 20)

    const splitInTwo = splitQuadraticBezierCurve(p0, p1, p2, 0.1)

    splitInTwo.forEach((curve, index) => {
      this.drawBezier(
        curve[0],
        curve[1],
        curve[2],
        index === 0 ? 0xff0000 : 0x00ff00
      )
    })
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
