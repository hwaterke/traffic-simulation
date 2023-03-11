import './style.css'
import Phaser from 'phaser'
import {TrafficScene} from './TrafficScene'
import {GAME_HEIGHT, GAME_WIDTH} from './constants'
import Center = Phaser.Scale.Center

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scene: TrafficScene,
  scale: {
    autoCenter: Center.CENTER_HORIZONTALLY,
  },
})
