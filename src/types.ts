// Raw representation of the graph (serializable)

export type Coordinates = {
  x: number
  y: number
}

export interface Node extends Coordinates {}

export type Edge = {
  source: number // Index of the starting Node
  target: number // Index of the end Node
  curvedControl?: [number, number]
}

export type Graph = {
  nodes: Node[]
  edges: Edge[]
}

export type RoadType = {
  lanes: readonly {readonly offset: number; readonly isReversed: boolean}[]
}

export interface LaneNode extends Coordinates {}

/*
Different types of lines are used for both Roads and lanes.

Here's what needed given a line:
- Return the length of the line
- Return the coordinates of a point at position x along the line
- Return the angle of a point at position x along the line
- Return a new line shifted x to the right
- Return a new line with x unit removed from the start and y from the end
- Render it on the screen ...
- Set the new positions (two points + control etc.) depending on the curve ofc
 */

// Data model !

/*

Nodes and Road


Road
  - type (dictates the rendering and number of lanes in each direction)
  - curved or not (if curved it needs a control point)
  - source node
  - target node
  - tags (one in, one out, straight connection, etc)



Dijkstra
  - From a source node to a target node

    - Find all lanes leaving the node.


    - For building and bootstraping
      Node and Segments

    - For actual game
      Node and Lanes
      A node adds lanes as well !

      Adding removing


Simulation
  private
  list of nodes = xy
  list of roads = start node and end node
  list of lane nodes !
  list of lanes =



  addRoad(startCoords, endCoords, type)
    create/reuse nodes, roads, lanes etc.
    return the road
  getRoad(coords)
  getNode(coords)
  removeRoad(road) -> Finds the road below

  roads (list of all roads)
  nodes (list of all nodes)
  lanes (list of all lanes, incl. the ones in nodes)
  laneNodes (list of all nodes used to connect lanes)

 */
