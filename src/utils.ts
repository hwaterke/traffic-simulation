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
  const dx1 = control.x - source.x
  const dy1 = control.y - source.y
  const dx2 = target.x - control.x
  const dy2 = target.y - control.y
  const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
  const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
  const direction1 = {x: dx1 / length1, y: dy1 / length1}
  const direction2 = {x: dx2 / length2, y: dy2 / length2}
  const perpendicular1 = {x: -direction1.y, y: direction1.x}
  const perpendicular2 = {x: -direction2.y, y: direction2.x}
  const shiftAmount = shiftDistance
  const newPoint1: Coordinates = {
    x: source.x + shiftAmount * perpendicular1.x,
    y: source.y + shiftAmount * perpendicular1.y,
  }
  const newControl: Coordinates = {
    x: control.x + (shiftAmount * (perpendicular1.x + perpendicular2.x)) / 2,
    y: control.y + (shiftAmount * (perpendicular1.y + perpendicular2.y)) / 2,
  }
  const newPoint2: Coordinates = {
    x: target.x + shiftAmount * perpendicular2.x,
    y: target.y + shiftAmount * perpendicular2.y,
  }
  return {
    source: newPoint1,
    control: newControl,
    target: newPoint2,
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

export const shortenCurveSegment = (
  source: Coordinates,
  control: Coordinates,
  target: Coordinates,
  distanceFromStart: number,
  distanceFromEnd: number
) => {
  const curve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(source.x, source.y),
    new Phaser.Math.Vector2(control.x, control.y),
    new Phaser.Math.Vector2(target.x, target.y)
  )

  const length = curve.getLength()
  const newStart = curve.getPointAt(distanceFromStart / length)
  const newEnd = curve.getPointAt((length - distanceFromEnd) / length)

  const startTangent = curve.getTangentAt(0)
  const endTangent = curve.getTangentAt(1)

  //  From ChatGPT, does not seem to work

  const newControl = {
    x:
      (2 * newEnd.x -
        source.x +
        startTangent.x * distanceFromStart +
        2 * newStart.x -
        target.x +
        endTangent.x * distanceFromEnd) /
      2,
    y:
      (2 * newEnd.y -
        source.y +
        startTangent.y * distanceFromStart +
        2 * newStart.y -
        target.y +
        endTangent.y * distanceFromEnd) /
      2,
  }

  return {
    source: newStart,
    target: newEnd,
    // control: new Phaser.Math.Vector2(newControl.x, newControl.y),
    control: curve.p1,
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

  // Compute the first control point for each end
  const c1 = {
    x: start.x + (dx * startTangent.x) / 3,
    y: start.y + (dy * startTangent.y) / 3,
  }
  const c2 = {
    x: end.x - (dx * endTangent.x) / 3,
    y: end.y - (dy * endTangent.y) / 3,
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
