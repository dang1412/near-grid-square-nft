import { Graphics, Renderer, Sprite, Texture, Text, BaseTexture, Container } from 'pixi.js'
import { Viewport } from 'pixi-viewport'

import { GameEngine } from './GameEngine'

export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

export interface GridMapOpts {
  pixelSize: number
  worldWidthPixel: number
  worldHeightPixel: number
  viewWidth: number
  viewHeight: number
  zoomPan?: boolean
  onSelectOutput?: (selection: SelectionRect) => void
  onMove?: (rawX: number, rawY: number, x: number, y: number) => void
  onClick?: (x: number, y: number) => void
  onCustomUpdate?: () => void
}

type PixelSpriteMap = {[index: number]: Sprite}
type PixelSizeMap = {[index: number]: [number, number]}
type PixelCoveredMap = {[index: number]: number}

export interface IGameScene {
  onInit(): void
  onOpen(): void
  onClose(): void
  onUpdate(): void
  onSelect(x1: number, y1: number, x2: number, y2: number): void
  onSelectEnd(): void
  onMove(rawX: number, rawY: number, x: number, y: number): void
}

export class GameSceneViewport implements IGameScene {
  protected viewport: Viewport

  protected opts: GridMapOpts
  protected selectingSprite: Sprite | null = null
  protected selectingRect: SelectionRect = {x: 0, y: 0, width: 0, height: 0}

  // protected imageCoveredPixels = new Set<number>()
  // protected imagePixels = new Set<number>()

  // layers
  protected layerContainerMap: {[layer: string]: Container} = {}
  protected layerPixelSpriteMap: {[layer: string]: PixelSpriteMap} = {}
  protected layerPixelSizeMap: {[layer: string]: PixelSizeMap} = {}
  protected layerPixelCoveredMap: {[layer: string]: PixelCoveredMap} = {}

  engine: GameEngine
  sceneIndex = -1

  constructor(engine: GameEngine, opts: GridMapOpts) {
    this.engine = engine
    this.opts = opts

    const worldWidth = opts.worldWidthPixel * opts.pixelSize
    const worldHeight = opts.worldHeightPixel * opts.pixelSize

    const renderer = engine.getRenderer()
    this.viewport = new Viewport({
      screenWidth: opts.viewWidth,
      screenHeight: opts.viewHeight,
      worldWidth,
      worldHeight,
      passiveWheel: false,
      interaction: renderer.plugins.interaction
    })

    this.sceneIndex = engine.addScene(this)
  }

  onMove(rawX: number, rawY: number, x: number, y: number): void {
    if (this.opts.onMove) {
      const [xCoord, yCoord] = this.getCoord(x, y)
      this.opts.onMove(rawX, rawY, xCoord, yCoord)
    }
  }

  onOpen(): void {
    this.viewport.pause = false
  }

  onClose(): void {
    this.viewport.pause = true
  }

  onInit(): void {
    const viewport = this.viewport
    const opts = this.opts
    const { zoomPan = true } = opts

    if (zoomPan) {
      viewport
      // .drag()
      .pinch()
      .wheel()
      .clamp({direction: 'all'})
      .clampZoom({minScale: 1})
    }

    const worldWidth = opts.worldWidthPixel * opts.pixelSize
    const worldHeight = opts.worldHeightPixel * opts.pixelSize
    viewport.moveCenter(worldWidth / 2, worldHeight / 2)

    // draw grid
    this._drawGrid()
  }

  private _drawGrid() {
    const viewport = this.viewport
    const g = viewport.addChild(new Graphics())
    g.lineStyle(1, 0x666666, 0.4, undefined, true)

    // draw vertical lines
    for (let i = 0; i <= this.opts.worldWidthPixel; i++) {
      const pos = i * this.opts.pixelSize
      g.moveTo(pos, 0)
      g.lineTo(pos, viewport.worldHeight)
    }

    // draw horizon lines
    for (let i = 0; i <= this.opts.worldHeightPixel; i++) {
      const pos = i * this.opts.pixelSize
      g.moveTo(0, pos)
      g.lineTo(viewport.worldWidth, pos)
    }
  }

  private getCoord(x: number, y: number): [number, number] {
    const viewport = this.viewport
    const wx = x / viewport.scaled + viewport.left
    const wy = y / viewport.scaled + viewport.top

    let xCoord = Math.floor(wx / this.opts.pixelSize)
    if (xCoord < 0) { xCoord = 0 }
    if (xCoord >= this.opts.worldWidthPixel) { xCoord = this.opts.worldWidthPixel - 1 }

    let yCoord = Math.floor(wy / this.opts.pixelSize)
    if (yCoord < 0) { yCoord = 0 }
    if (yCoord >= this.opts.worldHeightPixel) { yCoord = this.opts.worldHeightPixel - 1 }

    return [xCoord, yCoord]
  }

  onSelect(x1: number, y1: number, x2: number, y2: number): void {
    // add the first time
    if (!this.selectingSprite) {
      this.selectingSprite = new Sprite(Texture.WHITE)
      this.viewport.addChild(this.selectingSprite)
    }

    const rect = this.selectingSprite
    rect.tint = 0xa3c6ff
    rect.alpha = 0.4
    rect.texture = Texture.WHITE

    const [x1Coord, y1Coord] = this.getCoord(x1, y1)
    const [x2Coord, y2Coord] = this.getCoord(x2, y2)
  
    rect.position.set(x1Coord * this.opts.pixelSize, y1Coord * this.opts.pixelSize)
    rect.width = (x2Coord - x1Coord + 1) * this.opts.pixelSize
    rect.height = (y2Coord - y1Coord + 1) * this.opts.pixelSize

    this.selectingRect = {
      x: x1Coord,
      y: y1Coord,
      width: x2Coord - x1Coord + 1,
      height: y2Coord - y1Coord + 1,
    }

    this.viewport.dirty = true
  }

  onUpdate(): void {
    // handle move
    // ArrowUp
    if (this.engine.getKeyPressed('w')) {
      this.moveViewportUp(6)
    }

    if (this.engine.getKeyPressed('s')) {
      this.moveViewportDown(6)
    }

    if (this.engine.getKeyPressed('a')) {
      this.moveViewportLeft(6)
    }

    if (this.engine.getKeyPressed('d')) {
      this.moveViewportRight(6)
    }

    // custom update
    if (this.opts.onCustomUpdate) {
      this.opts.onCustomUpdate()
    }

    if (this.viewport.dirty) {
      const renderer = this.engine.getRenderer()
      renderer.render(this.viewport)
    }
  }

  onSelectEnd(): void {
    if (this.opts.onSelectOutput) {
      this.opts.onSelectOutput(this.selectingRect)
    }
  }

  protected moveViewportUp(speed: number) {
    this.viewport.top -= Math.max(Math.min(speed / this.viewport.scaled, this.viewport.top), 0)
  }

  protected moveViewportDown(speed: number) {
    const maxTop = this.viewport.worldHeight - this.viewport.screenHeightInWorldPixels - this.viewport.top
    this.viewport.top += Math.max(Math.min(speed / this.viewport.scaled, maxTop), 0)
  }

  protected moveViewportLeft(speed: number) {
    this.viewport.left -= Math.max(Math.min(speed / this.viewport.scaled, this.viewport.left), 0)
  }

  protected moveViewportRight(speed: number) {
    const maxLeft = this.viewport.worldWidth - this.viewport.screenWidthInWorldPixels - this.viewport.left
    this.viewport.left += Math.max(Math.min(speed / this.viewport.scaled, maxLeft), 0)
  }

  protected addLayer(layer = ''): Container {
    // init layer with no sprites
    if (!this.layerPixelSpriteMap[layer]) {
      this.layerPixelSpriteMap[layer] = {}
    }

    if (!this.layerPixelSizeMap[layer]) {
      this.layerPixelSizeMap[layer] = {}
    }

    if (!this.layerPixelCoveredMap[layer]) {
      this.layerPixelCoveredMap[layer] = {}
    }

    if (!this.layerContainerMap[layer]) {
      this.layerContainerMap[layer] = new Container()
      this.viewport.addChild(this.layerContainerMap[layer])
      console.log('Add layer', layer)
    }

    return this.layerContainerMap[layer]
  }

  addGridSprite(x: number, y: number, layer = ''): Sprite {
    const pixel = new Sprite(Texture.WHITE)
    pixel.width = pixel.height = this.opts.pixelSize
    pixel.position.set(x * this.opts.pixelSize, y * this.opts.pixelSize)

    return this._addSprite(x, y, pixel, layer)
  }

  addGridText(x: number, y: number, text: string, layer = ''): Sprite {
    const pixel = new Text(text, {fontFamily : 'Arial', fontSize: 14, fill : 0xff1010, align : 'center'})
    pixel.anchor.set(0.5)
    pixel.position.set((x + 0.5) * this.opts.pixelSize, (y + 0.5) * this.opts.pixelSize)

    return this._addSprite(x, y, pixel, layer)
  }

  private _addSprite(x: number, y: number, pixel: Sprite, layer = ''): Sprite {
    const container = this.addLayer(layer)
    const pixelSpriteMap = this.layerPixelSpriteMap[layer]
    const index = y * this.opts.worldWidthPixel + x
    if (!pixelSpriteMap[index]) {
      pixelSpriteMap[index] = pixel
      container.addChild(pixel)
      this.viewport.dirty = true
    }

    return pixelSpriteMap[index]
  }

  destroy() {
    console.log('Release all memory!!')
  }

  setPixel(x: number, y: number, tint?: number, alpha?: number, layer = '') {
    const pixel = this.addGridSprite(x, y, layer)
    if (tint) {
      pixel.tint = tint
    }

    if (alpha) {
      pixel.alpha = alpha
    }
    this.viewport.dirty = true
  }

  private addAreaTexture(area: SelectionRect, texture: Texture = Texture.WHITE, layer = ''): Sprite {
    const { x, y, width, height } = area

    const pixel = this.addGridSprite(x, y, layer)
    pixel.texture = texture
    pixel.width = width * this.opts.pixelSize
    pixel.height = height * this.opts.pixelSize
    pixel.tint = 0xffffff
    pixel.alpha = 1

    //TODO add map

    return pixel
  }

  async addImageURL(area: SelectionRect, imageURL: string, layer = 'image') : Promise<Sprite>{
    this.addLayer(layer)
    const texture = await Texture.fromURL(imageURL)
    return this.addAreaTexture(area, texture, layer)
  }

  addImageElement(area: SelectionRect, img: HTMLImageElement, layer = 'image'): Sprite {
    this.addLayer(layer)
    const texture = new Texture(new BaseTexture(img))
    return this.addAreaTexture(area, texture, layer)
  }

  setSelectingImage(img: HTMLImageElement) {
    if (!this.selectingSprite) { return }
    this.selectingSprite.texture = new Texture(new BaseTexture(img))
    this.selectingSprite.alpha = 0.8

    this.viewport.dirty = true
  }

  protected getIndex(x: number, y: number): number {
    return y * this.opts.worldWidthPixel + x
  }

  protected getXYFromIndex(index: number): [number, number] {
    const x = index % this.opts.worldWidthPixel
    const y = (index - x) / this.opts.worldWidthPixel

    return [x, y]
  }
}
