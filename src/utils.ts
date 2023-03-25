import {Coordinates, Graph} from './types'

export const randomElement = <T>(list: T[]): T => {
  return list[Math.floor(Math.random() * list.length)]
}

export const getDistance = (
  coordinatesA: Coordinates,
  coordinatesB: Coordinates
): number => {
  return Phaser.Math.Distance.Between(
    coordinatesA.x,
    coordinatesA.y,
    coordinatesB.x,
    coordinatesB.y
  )
}

export const getMidpoint = (
  coordinatesA: Coordinates,
  coordinatesB: Coordinates
): Coordinates => {
  const midpointX = (coordinatesA.x + coordinatesB.x) / 2
  const midpointY = (coordinatesA.y + coordinatesB.y) / 2
  return {x: midpointX, y: midpointY}
}

export const getDirection = (
  source: Coordinates,
  target: Coordinates
): Coordinates => {
  const length = getDistance(source, target)
  const directionX = (target.x - source.x) / length
  const directionY = (target.y - source.y) / length
  return {x: directionX, y: directionY}
}

export const getParallelLinePoints = (
  source: Coordinates,
  target: Coordinates,
  shiftDistance: number
): {source: Coordinates; target: Coordinates} => {
  const slope = (target.y - source.y) / (target.x - source.x)
  const angle = Math.atan(slope)
  const perpendicularAngle = angle + Math.PI / 2
  const newX1 = source.x + shiftDistance * Math.cos(perpendicularAngle)
  const newY1 = source.y + shiftDistance * Math.sin(perpendicularAngle)
  const newX2 = target.x + shiftDistance * Math.cos(perpendicularAngle)
  const newY2 = target.y + shiftDistance * Math.sin(perpendicularAngle)
  return {
    source: {x: newX1, y: newY1},
    target: {x: newX2, y: newY2},
  }
}

export const getParallelCurvePoints = (
  source: Coordinates,
  target: Coordinates,
  control: Coordinates,
  shiftDistance: number
): {source: Coordinates; target: Coordinates; control: Coordinates} => {
  // calculate tangent vectors at each point on the curve
  const t0: Coordinates = {x: control.x - source.x, y: control.y - source.y}
  const t2: Coordinates = {x: target.x - control.x, y: target.y - control.y}

  // normalize tangent vectors
  const t0len = Math.sqrt(t0.x * t0.x + t0.y * t0.y)
  const t2len = Math.sqrt(t2.x * t2.x + t2.y * t2.y)
  const t0n: Coordinates = {x: t0.x / t0len, y: t0.y / t0len}
  const t2n: Coordinates = {x: t2.x / t2len, y: t2.y / t2len}

  // calculate normal vectors by rotating tangent vectors 90 degrees clockwise
  const n0: Coordinates = {x: t0n.y, y: -t0n.x}
  const n2: Coordinates = {x: t2n.y, y: -t2n.x}

  // calculate new points offset by half the line width on the right-hand side
  const r0: Coordinates = {
    x: source.x + n0.x * shiftDistance,
    y: source.y + n0.y * shiftDistance,
  }
  const r1: Coordinates = {
    x: control.x + n0.x * shiftDistance + n2.x * shiftDistance,
    y: control.y + n0.y * shiftDistance + n2.y * shiftDistance,
  }
  const r2: Coordinates = {
    x: target.x + n2.x * shiftDistance,
    y: target.y + n2.y * shiftDistance,
  }

  return {
    source: r0,
    control: r1,
    target: r2,
  }
}

export const shortenLineSegment = (
  source: Coordinates,
  target: Coordinates,
  distanceFromStart: number,
  distanceFromEnd: number
): {
  source: Coordinates
  target: Coordinates
} => {
  const length = getDistance(source, target)
  const midpoint = getMidpoint(source, target)
  const direction = getDirection(source, target)

  const lengthToStart = length / 2 - distanceFromStart
  const lengthToEnd = length / 2 - distanceFromEnd

  const newSourceX = midpoint.x - direction.x * lengthToStart
  const newSourceY = midpoint.y - direction.y * lengthToStart
  const newTargetX = midpoint.x + direction.x * lengthToEnd
  const newTargetY = midpoint.y + direction.y * lengthToEnd

  return {
    source: {x: newSourceX, y: newSourceY},
    target: {x: newTargetX, y: newTargetY},
  }
}

function splitQuadraticBezierCurve(
  p0: Coordinates,
  p1: Coordinates,
  p2: Coordinates,
  t: number
): [Coordinates[], Coordinates[]] {
  const q0: Coordinates = {
    x: p0.x + t * (p1.x - p0.x),
    y: p0.y + t * (p1.y - p0.y),
  }
  const q1: Coordinates = {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  }
  const r: Coordinates = {
    x: q0.x + t * (q1.x - q0.x),
    y: q0.y + t * (q1.y - q0.y),
  }
  return [
    [p0, q0, r],
    [r, q1, p2],
  ]
}

export const shortenCurveSegment = (
  source: Coordinates,
  control: Coordinates,
  target: Coordinates,
  distanceFromStart: number,
  distanceFromEnd: number
) => {
  const originalCurve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(source.x, source.y),
    new Phaser.Math.Vector2(control.x, control.y),
    new Phaser.Math.Vector2(target.x, target.y)
  )

  const length = originalCurve.getLength()

  const [_, second] = splitQuadraticBezierCurve(
    source,
    control,
    target,
    distanceFromStart / length
  )

  const secondCurve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(second[0].x, second[0].y),
    new Phaser.Math.Vector2(second[1].x, second[1].y),
    new Phaser.Math.Vector2(second[2].x, second[2].y)
  )

  const secondLength = secondCurve.getLength()

  const [result] = splitQuadraticBezierCurve(
    second[0],
    second[1],
    second[2],
    (secondLength - distanceFromEnd) / secondLength
  )

  return {
    source: result[0],
    control: result[1],
    target: result[2],
  }
}

// Given a start point, end point, and tangent vectors at each end,
// compute the control points for a cubic Bézier curve that approximates
// the corresponding Hermite curve.
export const hermiteToBezier = (
  start: Coordinates,
  end: Coordinates,
  startTangent: Coordinates,
  endTangent: Coordinates
): Coordinates[] => {
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const size = Math.sqrt(dx * dx + dy * dy)

  // Compute the first control point for each end
  const c1 = {
    x: start.x + (size * startTangent.x) / 3,
    y: start.y + (size * startTangent.y) / 3,
  }
  const c2 = {
    x: end.x - (size * endTangent.x) / 3,
    y: end.y - (size * endTangent.y) / 3,
  }

  // Construct and return the control points as an array
  return [c1, c2, end]
}

export const closestNodeIndex = (
  graph: Graph,
  x: number,
  y: number
): number | null => {
  for (const [index, node] of graph.nodes.entries()) {
    if (Math.abs(node.x - x) < 10 && Math.abs(node.y - y) < 10) {
      return index
    }
  }
  return null
}
