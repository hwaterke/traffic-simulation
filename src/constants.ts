import {Graph} from './types'

export const GAME_WIDTH = 1600
export const GAME_HEIGHT = 900

export const GRAPH: Graph = {
  nodes: [
    // Intersection
    {x: 810, y: 480}, // 0
    {x: 810, y: 420}, // 1
    {x: 790, y: 420}, // 2
    {x: 790, y: 480}, // 3
    {x: 830, y: 440}, // 4
    {x: 770, y: 440}, // 5
    {x: 830, y: 460}, // 6
    {x: 770, y: 460}, // 7

    {x: 810, y: 198},
    {x: 1046, y: 440},
    {x: 1056, y: 460},
    {x: 810, y: 730},
    {x: 450, y: 460},
    {x: 790, y: 700},
    {x: 790, y: 200},
    {x: 300, y: 440}, // 15
    {x: 20, y: 300}, // 16
    {x: 1580, y: 300},
    {x: 20, y: 600},
    {x: 1580, y: 600},
    {x: 200, y: 40},
    {x: 1400, y: 40},
    {x: 200, y: 860},
    {x: 1400, y: 860},
    {x: 300, y: 200}, // 24
    {x: 545, y: 320},
    {x: 300, y: 320},
    {x: 545, y: 200},
    {x: 450, y: 550},
  ],
  edges: [
    // Intersection
    {source: 0, target: 1},
    {source: 0, target: 5, curvedControl: [810, 440]},
    {source: 0, target: 6, curvedControl: [810, 460]},

    {source: 2, target: 3},
    {source: 2, target: 5, curvedControl: [790, 440]},
    {source: 2, target: 6, curvedControl: [790, 460]},

    {source: 4, target: 5},
    {source: 4, target: 1, curvedControl: [810, 440]},
    {source: 4, target: 3, curvedControl: [790, 440]},

    {source: 7, target: 6},
    {source: 7, target: 1, curvedControl: [810, 460]},
    {source: 7, target: 3, curvedControl: [790, 460]},

    {source: 1, target: 8},
    {source: 8, target: 9, curvedControl: [1150, 150]},
    {source: 9, target: 4},
    {source: 5, target: 15},

    {source: 15, target: 26},
    {source: 26, target: 24},
    {source: 24, target: 27},
    {source: 27, target: 14},
    {source: 26, target: 25},
    {source: 25, target: 27},

    {source: 14, target: 2},
    {source: 6, target: 10},
    {source: 10, target: 11, curvedControl: [1050, 950]},

    {source: 11, target: 0},
    {source: 12, target: 7},
    {source: 13, target: 28, curvedControl: [450, 700]},
    {source: 28, target: 12},
    {source: 3, target: 13},

    {source: 16, target: 20, curvedControl: [20, 40]},
    {source: 20, target: 21},
    {source: 21, target: 17, curvedControl: [1580, 40]},

    {source: 19, target: 23, curvedControl: [1580, 860]},
    {source: 23, target: 22},
    {source: 22, target: 18, curvedControl: [20, 860]},

    {source: 18, target: 16},
    {source: 17, target: 19},
    {source: 11, target: 28, curvedControl: [300, 730]},

    // Highway
    {source: 17, target: 9, curvedControl: [1580, 440]},
    {source: 10, target: 19, curvedControl: [1580, 460]},
    {source: 18, target: 12, curvedControl: [20, 460]},
    {source: 15, target: 16, curvedControl: [20, 440]},
  ],
}
