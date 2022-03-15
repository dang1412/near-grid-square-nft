import { Renderer } from 'pixi.js'

import { IGameScene } from './GameSceneViewport'

export interface GameEngineOpts {
  width: number
  height: number
  onMessage?: (mess: string) => void
}

export class GameEngine {
  private renderer: Renderer
  private gameScenes: IGameScene[] = []
  private activeSceneIndex = -1

  // key
  private keyPressedMap: {[key: string]: boolean} = {}
  private stop = false

  constructor(private canvas: HTMLCanvasElement, private opts: GameEngineOpts) {
    const renderer = this.renderer = new Renderer({
      width: opts.width,
      height: opts.height,
      // antialias: true,
      view: canvas,
      backgroundColor: 0xfefefe
    })

    renderer.view.style.border = '1px solid #999999'
    this._setupSelect()
    this._setupKey()
    this._runUpdate()
  }

  addScene(scene: IGameScene): number {
    const index = this.gameScenes.length
    this.gameScenes.push(scene)
    scene.onInit()

    return index
  }

  changeScene(index: number) {
    if (index === this.activeSceneIndex) { return }

    const current = this.getCurrentScene()
    if (current) {
      current.onClose()
    }

    const next = this.gameScenes[index]
    next.onOpen()

    this.activeSceneIndex = index
  }

  private _runUpdate() {
    if (this.stop) { return }

    const current = this.getCurrentScene()
    if (current) {
      current.onUpdate()
    }

    requestAnimationFrame(() => this._runUpdate())
  }

  getRenderer(): Renderer {
    return this.renderer
  }

  private getCurrentScene(): IGameScene | null {
    return this.gameScenes[this.activeSceneIndex]
  }

  private _setupSelect() {
    const canvas = this.renderer.view

    let selecting = false
    let [startX, startY] = [0 ,0]

    const getXY = (e: MouseEvent) => {
      const x = e.x - canvas.offsetLeft
      const y = e.y - canvas.offsetTop + window.scrollY;
      return [x, y]
    }

    const onSelect = (startX: number, startY: number, endX: number, endY: number) => {
      const scene = this.getCurrentScene()
      if (!scene) { return }

      const [x1, x2] = startX < endX ? [startX, endX] : [endX, startX]
      const [y1, y2] = startY < endY ? [startY, endY] : [endY, startY]

      scene.onSelect(x1, y1, x2, y2)
    }

    canvas.addEventListener('mousedown', (e) => {
      [startX, startY] = getXY(e)
      onSelect(startX, startY, startX, startY)
      selecting = true
    })

    canvas.addEventListener('mouseup', (e) => {
      if (!selecting) { return }
      selecting = false

      const scene = this.getCurrentScene()
      if (scene) {
        scene.onSelectEnd()
      }
    })

    canvas.addEventListener('mousemove', (e) => {
      if (selecting) {
        const [endX, endY] = getXY(e)
        onSelect(startX, startY, endX, endY)
      }
    })
  }

  private _setupKey() {
    const onKeyUpDown = (event: KeyboardEvent) => {
      const pressed = event.type === 'keydown' ? true : false
      this.keyPressedMap[event.key] = pressed
    }

    document.addEventListener('keydown', onKeyUpDown)
    document.addEventListener('keyup', onKeyUpDown)
  }

  getKeyPressed(key: string): boolean {
    return this.keyPressedMap[key] || false
  }

  destroy() {
    this.stop = true
  }

  message(mess: string){
    if (this.opts.onMessage) {
      this.opts.onMessage(mess)
    }
  }
}
