# Traffic simulation with Phaser 3

This is a traffic simulation written just for fun. It is heavily inspired by an
article from
[Bilal Himite](https://towardsdatascience.com/simulating-traffic-flow-in-python-ee1eab4dd20f).

It uses Phaser as the rendering engine.

# Usage

Simply run `npm run dev` and open your browser.

To draw new graphs use the `GraphBuilderScene` scene in `main.ts`. The graph is
logged in the console and can then be place in `constants.ts` instead of the
default one.

# Limitations

- Cars can crash into each other and even go through other cars at intersections
  as they only monitor the lead car on their road.

# TODO

- [x] Make car clickable to display position, speed and acceleration
- [x] Spawn vehicle manually
- [x] Prevent spawning vehicle on top of each other
- [x] Make cars aware of cars on the next road (to avoid crash)
- [x] Add ability to pause by pressing `p`
- [x] Add traffic signs
- [ ] Add buttons to toggle debug
- [ ] Improve rendering
- [ ] Make cars aware of cars going to the same next road on their path (to
      avoid crash)
- [ ] Create a graph generator for random road layouts
- [ ] Use delta time for accurate FPS
- [ ] Make sure the simulation logic and rendering concerns are isolated
- [ ] Reimplement the rendering using [d3](https://d3js.org/)
- [ ] Road speed limit
- [ ] Add curved roads
