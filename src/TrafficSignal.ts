const CYCLE_LENGTH = 500
const CYCLE_COOLDOWN = 50 // Time before the current cycle allows traffic

export class TrafficSignal {
  private activeGroupIndex = 0 // The group currently allowing traffic.
  private currentCycleLength = CYCLE_LENGTH
  public readonly stopDistance = 20
  public readonly slowDistance = 55

  constructor(private groupsCount: number) {}

  isGroupStopped(groupIndex: number): boolean {
    if (groupIndex === this.activeGroupIndex) {
      // At the start of a cycle, traffic stays stopped to allow previous cycle to leave the intersection
      if (this.currentCycleLength > CYCLE_LENGTH - CYCLE_COOLDOWN) {
        return true
      }

      return false
    }

    return true
  }

  update() {
    this.currentCycleLength--
    if (this.currentCycleLength < 0) {
      this.currentCycleLength = CYCLE_LENGTH
      this.activeGroupIndex = (this.activeGroupIndex + 1) % this.groupsCount
    }
  }
}
