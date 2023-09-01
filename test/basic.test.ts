import {expect, test} from 'vitest'
import {Graph} from '../src/types'
import {Simulation} from '../src/simulation/Simulation'

test('Simulation', () => {
  const graph: Graph = {
    nodes: [
      {x: 10, y: 10},
      {x: 110, y: 10},
    ],
    edges: [
      {
        source: 0,
        target: 1,
      },
    ],
  }

  const simulation = new Simulation(graph, {
    onVehicleAdded: () => {},
    onVehicleRemoved: () => {},
  })

  expect(simulation.roads.length).toBe(1)
})

// Test idea.
// Two vehicle on two straight parallel roads.
// One road with no intermediary nodes and one with a ton.
// Vehicle should move at the same speed and reach the end at the same time
