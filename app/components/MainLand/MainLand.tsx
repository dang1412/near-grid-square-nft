import { useCallback, useEffect, useRef, useState } from 'react'
import { Sprite } from 'pixi.js'
import { useRecoilValue } from 'recoil'
import { DropShadowFilter } from '@pixi/filter-drop-shadow'
import { VirtualElement } from '@popperjs/core'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Popper from '@mui/material/Popper'

import { coordinateToIndex, GameEngine, GameSceneViewport, getIndexArray, indexToCoordinate, iterateSelect, SelectionRect } from '../../lib'
import { Account, getContractDataService, PickCount, PixelImage, type Pixel } from '../../services'
import { platformState } from '../PlatformSelect'
import { PixelMap, useAccountPick, useLogin, useLotteryInfo, usePickCount, usePixelData } from '../hooks'
import { PopperInfo } from './PopperInfo'
import { uploadIPFS } from './upload-ipfs'

const WORLD_SIZE = 100
const PIXEL_SIZE = 8

// function gridToWorldCoord(gx: number, gy: number): [number, number] {
//   const wx = gx - WORLD_SIZE / 2
//   const wy = gy - WORLD_SIZE / 2

//   return [wx, wy]
// }

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

function getVirtualElement(x: number, y: number): VirtualElement {
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

function pixelToMapXY(pixelId: number): [number, number] {
  const [wx, wy] = indexToCoordinate(pixelId)
  const [x, y] = [wx + WORLD_SIZE / 2, wy + WORLD_SIZE / 2]

  return [x, y]
}

// reflect all minted pixels on map
function reflectPixels(scene: GameSceneViewport, pixels: Pixel[], account: Account | null) {
  for (const pixel of pixels) {
    // convert to map coordinate
    const [x, y] = pixelToMapXY(pixel.pixelId)
    reflectPixelCoordinate(scene, x, y, !!account && account.addr === pixel.owner)

    // pixel.interactive = true
    // pixel.on('mouseover', () => makeSpriteFloat(pixel))
    // pixel.on('pointerout', () => undoSpriteFloat(pixel))
  }
}

// reflect a minted pixel on map
function reflectPixelCoordinate(scene: GameSceneViewport, x: number, y: number, isOwner: boolean) {
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
let maxPickNumber = 12
function reflectPickedPixels(scene: GameSceneViewport, pickCounts: PickCount[], ownPickSet: Set<number>) {
  // update maxPickNumber
  maxPickNumber = Math.max.apply(null, pickCounts.map(p => p.count)) + 12
  for (const pick of pickCounts) {
    // convert to map coordinate
    const [x, y] = pixelToMapXY(pick.pixelId)
    reflectPickedXY(scene, x, y, pick.count, ownPickSet.has(pick.pixelId))
  }
}

function reflectPickedXY(scene: GameSceneViewport, x: number, y: number, count: number, owned: boolean) {
  if (count > maxPickNumber) count = maxPickNumber
  const pickSprite = scene.addGridSprite(x, y, 'pick')
  if (owned) {
    pickSprite.tint = 0x00ff00
  } else {
    pickSprite.tint = 0xff0000
  }
  pickSprite.alpha = count / maxPickNumber * 0.9
}

// https://ipfs.infura.io/ipfs/QmQPdxccM4czLHHpJGkB1zPGvfzaRwhzoyJkzuweY9kF7n
function reflectImages(scene: GameSceneViewport, images: PixelImage[]) {
  for (const image of images) {
    const url = `https://ipfs.infura.io/ipfs/${image.cid}`
    const [x, y] = pixelToMapXY(image.pixelId)
    scene.addImageURL({x, y, width: image.w, height: image.h}, url)
  }
}

export const MainLand: React.FC<{}> = () => {
  const platform = useRecoilValue(platformState)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<GameSceneViewport | null>(null)

  const [select, setSelect] = useState<SelectionRect>({x: 0, y: 0, width: 0, height: 0})
  // const [totalReward, setTotalReward] = useState('1000')

  // pixel data
  const { pixelMap, loadPixels, updatePixelMap } = usePixelData(platform)
  const { account } = useLogin(platform)

  // pick data
  const { pickCountMap, loadPickCount } = usePickCount(platform)
  const { accountPickSet, loadAccountPick } = useAccountPick(platform)

  // images
  // const [images, setImages] = useState<PixelImage[]>([])

  // lottery info
  const { lotteryAccount, totalReward, lotteryIndex, lotteryInfo, blockNumber } = useLotteryInfo(platform)

  useEffect(() => {
    (async () => {
      // Service
      const service = await getContractDataService(platform)
      if (!service || !wrapperRef.current || !canvasRef.current) { return }

      // Map params
      const width = Number(wrapperRef.current.getBoundingClientRect().width)
      const height = 600
      const canvas = canvasRef.current

      // Engine
      const engine = new GameEngine(canvas, { width, height })

      // Map scene
      const mainScene = new GameSceneViewport(engine, {
        pixelSize: PIXEL_SIZE,
        worldWidthPixel: WORLD_SIZE,
        worldHeightPixel: WORLD_SIZE,
        viewWidth: width,
        viewHeight: height,
        onSelect: (clientX, clientY, select) => {
          setSelect(select)
          setOpen(true)
          setAnchorEl(getVirtualElement(clientX + 15, clientY - 30))
          setCursorXCoord(select.x - WORLD_SIZE / 2)
          setCursorYCoord(select.y - WORLD_SIZE / 2)
        },
        onMove: (clientX, clientY, x, y) => {
          // only do if not selecting
          if (mainScene.isSelecting()) return 
          // console.log(x, y)
          // setOpen(true)
          // setAnchorEl(getVirtualElement(clientX + 15, clientY + 15))
          // setCursorXCoord(x)
          // setCursorYCoord(y)
        }
      })

      // switch to the main scene
      engine.changeScene(mainScene.sceneIndex)

      // store the main scene object
      sceneRef.current = mainScene

      // add layer in order: mint, image, pick
      await loadPixels()
      const images = await service.getPixelImages()
      reflectImages(mainScene, images)
      await loadPickCount()
    })()
  }, [platform])

  // reflect minted pixels on map
  useEffect(() => {
    const mainScene = sceneRef.current
    if (mainScene) {
      reflectPixels(mainScene, Object.values(pixelMap), account)
    }
  }, [pixelMap, account])

  // reflect picked pixels (lottery) on map
  useEffect(() => {
    const mainScene = sceneRef.current
    if (mainScene) {
      reflectPickedPixels(mainScene, Object.values(pickCountMap), accountPickSet)
    }
  }, [pickCountMap, accountPickSet])

  // update account picked
  useEffect(() => {
    loadAccountPick(account)
  }, [account])

  // mint pixels
  // TODO can improve performance by using buffer state for user added pixels
  const mint = useCallback(async () => {
    const mainScene = sceneRef.current
    const service = await getContractDataService(platform)
    if (account && service && mainScene) {
      const pixelId = coordinateToIndex(select.x - WORLD_SIZE / 2, select.y - WORLD_SIZE / 2)
      await service.mintPixels(pixelId, select.width, select.height)

      // get pixelMap update
      const update: PixelMap = {}
      const pixelIds = getIndexArray(pixelId, select.width, select.height)
      for (const id of pixelIds) {
        update[id] = {
          pixelId: id,
          owner: account.addr,
          dateMinted: ''
        }
      }

      // update state and reflect on map
      updatePixelMap(update)

      // update on map
      // iterateSelect(select, (x, y) => {
      //   // reflectPixelCoordinate(mainScene, x, y, true)

      //   // update pixelMap state
      //   const pixelId = coordinateToIndex(x - WORLD_SIZE / 2, y - WORLD_SIZE / 2)
      //   const pixel: Pixel = {
      //     pixelId,
      //     owner: account.addr,
      //     dateMinted: ''
      //   }
      //   update[pixelId] = pixel
      // })

      // TODO update pixelMap
    }
  }, [platform, account, select, updatePixelMap])

  // pick lottery tickets
  const pick = async () => {
    const mainScene = sceneRef.current
    const service = await getContractDataService(platform)
    if (service && mainScene) {
      const pixel = coordinateToIndex(select.x - WORLD_SIZE / 2, select.y - WORLD_SIZE / 2)
      await service.pickPixels(pixel, select.width, select.height)

      // update pickCount state and on map
      const pixelIds = getIndexArray(pixel, select.width, select.height)
      for (const pixelId of pixelIds){
        if (!pickCountMap[pixelId]) {
          pickCountMap[pixelId] = {
            pixelId,
            count: 0
          }
        }
        // update pickCountMap
        const count = ++pickCountMap[pixelId].count
        // update on map
        const [x, y] = pixelToMapXY(pixelId)
        reflectPickedXY(mainScene, x, y, count, true)

        // update account pick state
        accountPickSet.add(pixelId)
      }
    }
  }

  // Popper state
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<VirtualElement>(getVirtualElement(0, 0))
  const [cursorXCoord, setCursorXCoord] = useState(0)
  const [cursorYCoord, setCursorYCoord] = useState(0)

  const id = open ? 'virtual-element-popper' : undefined

  // mouse leave the canvas
  const handleMouseLeave = () => {
    // setOpen(false)
  }

  // handle close popper
  const handleCloseSelect = () => {
    const mainScene = sceneRef.current
    if (mainScene) {
      // clear select
      mainScene.clearSelect()
    }
    setOpen(false)
  }

  const selectImage = (image: HTMLImageElement) => {
    const mainScene = sceneRef.current
    if (mainScene) {
      mainScene.setSelectingImage(image)
    }
  }

  const upload = async (file: File) => {
    const mainScene = sceneRef.current
    const service = await getContractDataService(platform)
    if (mainScene && service) {
      // put image on map
      const image = new Image()
      image.src = URL.createObjectURL(file)
      mainScene.addImageElement(select, image)

      // upload to ipfs
      const cid = await uploadIPFS(file)

      // set image onchain
      const pixel = coordinateToIndex(select.x - WORLD_SIZE / 2, select.y - WORLD_SIZE / 2)
      await service.setPixelImage(pixel, cid, select.width, select.height)

      // clear select
      handleCloseSelect()
    }
  }

  return (
    <div ref={(_c) => wrapperRef.current = _c} style={{width: '100%', maxWidth: 800}}>
      <Typography variant="body1" color="success">
        Address: {lotteryAccount} <br/>
        Round: {lotteryIndex} <br/>
        Ticket Price: {lotteryInfo?.price} <br/>
        Start Block: {lotteryInfo?.start} <br/>
        End Block: {lotteryInfo ? lotteryInfo.start + lotteryInfo.length : 0} <br/>
        Current Block: {blockNumber}
      </Typography>
      <Typography variant="h4" color="success" style={{textAlign: 'center'}}>
        {totalReward} PIX
      </Typography>
      <canvas onMouseOut={handleMouseLeave} ref={(_c) => canvasRef.current = _c} style={{backgroundColor: 'grey'}} />
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
      >
        <PopperInfo
          x={cursorXCoord}
          y={cursorYCoord}
          w={select.width}
          h={select.height}
          onClose={handleCloseSelect}
          onMintClick={mint}
          onPickClick={pick}
          onSelectImage={selectImage}
          onUploadClick={upload}
        />
      </Popper>
      {/* <Box style={{ display: 'flex' }} sx={{ border: 1, p: 1, bgcolor: 'background.paper' }}>
        Selected: {`(${select.x}, ${select.y}), [${select.width} x ${select.height}]`}
        <span style={{ flexGrow: 1 }} />
      </Box> */}
      <div>
        <span style={{backgroundColor: '#ababab', opacity: '0.4', border: '1px solid'}}>&nbsp;&nbsp;</span> Minted pixel <br/>
        <span style={{backgroundColor: '#dce090', opacity: '0.4', border: '1px solid'}}>&nbsp;&nbsp;</span> Owned minted pixel <br/>
        <span style={{backgroundColor: 'red', opacity: '0.4', border: '1px solid'}}>&nbsp;&nbsp;</span> Picked pixel <br/>
        <span style={{backgroundColor: 'green', opacity: '0.4', border: '1px solid'}}>&nbsp;&nbsp;</span> Owned picked pixel <br/>
      </div>
    </div>
  )
}