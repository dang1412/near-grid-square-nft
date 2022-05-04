import { Sprite } from 'pixi.js'
import { VirtualElement } from '@popperjs/core'

import { GameSceneViewport, indexToCoordinate } from '../../lib'
import { type Account, type PickCount, type PixelImage, type Pixel } from '../../services'

export const WORLD_SIZE = 100
export const PIXEL_SIZE = 8

const move = 0.5
function makeSpriteFloat(sprite: Sprite) {
  console.log('makeSpriteFloat')
  sprite.position.x -= move
  sprite.position.y -= move
  // sprite.filters = [new DropShadowFilter()]
}

function undoSpriteFloat(sprite: Sprite) {
  sprite.position.x += move
  sprite.position.y += move
  sprite.filters = []
}

export function getVirtualElement(x: number, y: number): VirtualElement {
  return {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      top: y,
      right: x,
      bottom: y,
      left: x,
      x: x,
      y: y,
      toJSON: () => {}
    })
  }
}

export function pixelToMapXY(pixelId: number): [number, number] {
  const [wx, wy] = indexToCoordinate(pixelId)
  const [x, y] = [wx + WORLD_SIZE / 2, wy + WORLD_SIZE / 2]

  return [x, y]
}

// reflect all minted pixels on map
export function reflectMintedPixels(scene: GameSceneViewport, pixels: Pixel[], account: Account | null) {
  for (const pixel of pixels) {
    // convert to map coordinate
    const [x, y] = pixelToMapXY(pixel.pixelId)
    reflectMintedPixelXY(scene, x, y, !!account && account.addr === pixel.owner)

    // pixel.interactive = true
    // pixel.on('mouseover', () => makeSpriteFloat(pixel))
    // pixel.on('pointerout', () => undoSpriteFloat(pixel))
  }
}

// reflect a minted pixel on map
export function reflectMintedPixelXY(scene: GameSceneViewport, x: number, y: number, isOwner: boolean) {
  const pixelSprite = scene.addGridSprite(x, y, 'mint')
  if (isOwner) {
    // pixelSprite.tint = 0xfce303
    pixelSprite.tint = 0xdce090
  } else {
    pixelSprite.tint = 0xababab
  }
  pixelSprite.alpha = 0.4
}

// reflect picked pixels on map
// let maxPickNumber = 12
const globalVars = {
  maxPickNumber: 12
}

export const DEFAULT_MAX_PICK = 12

export function reflectPickedPixels(scene: GameSceneViewport, pickCounts: PickCount[], ownPickSet: Set<number>) {
  // update maxPickNumber
  const maxPickNumber = Math.max.apply(null, pickCounts.map(p => p.count)) + DEFAULT_MAX_PICK
  console.log('maxPickNumber', maxPickNumber)
  for (const pick of pickCounts) {
    // convert to map coordinate
    const [x, y] = pixelToMapXY(pick.pixelId)
    const alpha = calculateAlpha(pick.count, maxPickNumber)
    reflectPickedXY(scene, x, y, alpha, ownPickSet.has(pick.pixelId))
  }
}

export function calculateAlpha(count: number, maxPick = DEFAULT_MAX_PICK): number {
  return count / maxPick * 0.8
}

export function reflectPickedXY(scene: GameSceneViewport, x: number, y: number, alpha: number, owned: boolean) {
  // maxPickNumber = maxPickNumber || 12
  // if (count > maxPickNumber) count = maxPickNumber
  // const pickSprite = scene.addGridSprite(x, y, 'pick')
  // if (owned) {
  //   pickSprite.tint = 0x00ff00
  // } else {
  //   pickSprite.tint = 0xff3526
  // }
  // pickSprite.alpha = count / maxPickNumber * 0.9
  const color = owned ? 0x00ff00 : 0xff0000
  scene.setPixel(x, y, color, alpha, 'pick')
}

// https://ipfs.infura.io/ipfs/QmQPdxccM4czLHHpJGkB1zPGvfzaRwhzoyJkzuweY9kF7n
export function reflectImages(scene: GameSceneViewport, images: PixelImage[]) {
  for (const image of images) {
    const url = `https://ipfs.io/ipfs/${image.cid}`
    const [x, y] = pixelToMapXY(image.pixelId)
    scene.addImageURL({x, y, width: image.w, height: image.h}, url)
  }
}
