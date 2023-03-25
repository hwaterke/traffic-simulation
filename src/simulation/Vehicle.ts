import {Lane} from './Simulation'
import {Coordinates} from '../types'

export class Vehicle {
  public x = 0 // Position along its current Lane [0;lane length]
  public speed = 0
  public acceleration = 0

  // Used to draw the vehicle
  public coordinates: Coordinates = {x: 0, y: 0}
  public angle: number = 0

  public path: Lane[] = []
  public currentLaneIndex = 0

  public shouldStop: boolean = false

  public readonly length = 10 + Math.random() * 10 // Length of the vehicle
  public maxSpeed = Math.floor(8 + Math.random() * 12)
  public readonly engineMaxSpeed = this.maxSpeed
  public readonly maxAcceleration = 1.44
  public readonly maxDeceleration = 4.61
  public readonly desiredDistanceFromLeadVehicle = 4
  public driverReactionTime = 1

  tick({
    leadVehicle,
    distanceToLeadVehicle,
  }: {
    leadVehicle: Vehicle | null
    distanceToLeadVehicle: number | null
  }) {
    const DT = 1 / 60

    // Update position and velocity
    if (this.speed + this.acceleration * DT < 0) {
      this.x -= 0.5 * this.speed * this.speed * this.acceleration
      this.speed = 0
    } else {
      this.speed += this.acceleration * DT
      this.x += this.speed * DT + (this.acceleration * DT * DT) / 2
    }

    // Update the acceleration
    let alpha = 0

    if (leadVehicle && distanceToLeadVehicle) {
      const speedDifference = this.speed - leadVehicle.speed

      if (distanceToLeadVehicle <= 0) {
        console.log(`Vehicle crashed.`)
        // Vehicle crashed into each other.
        this.speed = 0
        this.acceleration = 0
        return
      }

      const sqrt = 2 * Math.sqrt(this.maxAcceleration * this.maxDeceleration)

      alpha =
        (this.desiredDistanceFromLeadVehicle +
          Math.max(
            0,
            this.driverReactionTime * this.speed +
              (speedDifference * this.speed) / sqrt
          )) /
        distanceToLeadVehicle
    }

    this.acceleration =
      this.maxAcceleration *
      (1 - Math.pow(this.speed / this.maxSpeed, 4) - Math.pow(alpha, 2))

    if (this.shouldStop) {
      // Brake as much as allowed.
      // We do not care if the acceleration stays negative as we do not allow the speed to go below 0
      this.acceleration = -this.maxDeceleration
    }
  }

  getCurrentLane(): Lane | null {
    return this.path.length > 0 && this.currentLaneIndex < this.path.length
      ? this.path[this.currentLaneIndex]
      : null
  }
}
