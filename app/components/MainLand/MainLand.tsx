import { useEffect, useRef, useState } from 'react'
import { Sprite } from 'pixi.js'
import { useRecoilValue } from 'recoil'
import { DropShadowFilter } from '@pixi/filter-drop-shadow'
import { VirtualElement } from '@popperjs/core'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Popper from '@mui/material/Popper'

import { coordinateToIndex, GameEngine, GameSceneViewport, indexToCoordinate, iterateSelect, SelectionRect } from '../../lib'
import { getContractDataService, type Pixel } from '../../services'
import { platformState } from '../PlatformSelect'
import { usePixelData } from '../hooks'
import { PopperInfo } from './PopperInfo'

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

function reflectPixels(scene: GameSceneViewport, pixels: Pixel[]) {
  for (const pixel of pixels) {
    const [wx, wy] = indexToCoordinate(Number(pixel.pixelId))
    const [x, y] = [wx + WORLD_SIZE / 2, wy + WORLD_SIZE / 2]
    const pixelSprite = scene.addGridSprite(x, y, 'mint')
    // pixel.width = PIXEL_SIZE * token.width
    // pixel.height = PIXEL_SIZE * token.height
    pixelSprite.tint = 0xababab
    pixelSprite.alpha = 0.6

    // pixel.interactive = true
    // pixel.on('mouseover', () => makeSpriteFloat(pixel))
    // pixel.on('pointerout', () => undoSpriteFloat(pixel))
  }
}

export const MainLand: React.FC<{}> = () => {
  const platform = useRecoilValue(platformState)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<GameSceneViewport | null>(null)

  const [select, setSelect] = useState<SelectionRect>({x: 0, y: 0, width: 0, height: 0})
  const [totalReward, setTotalReward] = useState('1000')

  const { pixelMap, loadPixels } = usePixelData(platform)

  useEffect(() => {
    (async () => {
      const service = await getContractDataService(platform)
      if (!service || !wrapperRef.current || !canvasRef.current) { return }
      const width = Number(wrapperRef.current.getBoundingClientRect().width)
      const height = 560
      const canvas = canvasRef.current

      const engine = new GameEngine(canvas, { width, height })
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

      engine.changeScene(mainScene.sceneIndex)
      sceneRef.current = mainScene

      await loadPixels()
    })()
  }, [platform])

  // reflect minted pixels on map
  useEffect(() => {
    const mainScene = sceneRef.current
    if (mainScene) {
      reflectPixels(mainScene, Object.values(pixelMap))
    }
  }, [pixelMap])

  const mint = async () => {
    const mainScene = sceneRef.current
    const service = await getContractDataService(platform)
    if (service && mainScene) {
      const token = coordinateToIndex(select.x - WORLD_SIZE / 2, select.y - WORLD_SIZE / 2)
      await service.mintPixels(token, select.width, select.height)

      iterateSelect(select, (x, y) => {
        const pixel = mainScene.addGridSprite(x, y, 'mint')
        pixel.tint = 0xababab
        pixel.alpha = 0.6

        // pixel.interactive = true
        // pixel.on('mouseover', () => makeSpriteFloat(pixel))
        // pixel.on('pointerout', () => undoSpriteFloat(pixel))
      })
    }
  }

  // const merge = async () => {
  //   const mainScene = sceneRef.current
  //   const service = await getContractDataService(platform)
  //   if (service && mainScene) {
  //     const token = coordinateToIndex(select.x - WORLD_SIZE / 2, select.y - WORLD_SIZE / 2)
  //     await service.mergePixels(token, select.width, select.height)

  //     const pixel = mainScene.addGridSprite(select.x, select.y, 'mint')
  //     pixel.width = PIXEL_SIZE * select.width
  //     pixel.height = PIXEL_SIZE * select.height
  //     pixel.alpha = 0.8

  //     iterateSelect(select, (x, y) => {
  //       if (x === select.x && y === select.y) { return }
  //       const pixel = mainScene.addGridSprite(x, y, 'mint')
  //       pixel.parent.removeChild(pixel)
  //     })
  //   }
  // }

  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<VirtualElement>(getVirtualElement(0, 0))
  const [cursorXCoord, setCursorXCoord] = useState(0)
  const [cursorYCoord, setCursorYCoord] = useState(0)

  const id = open ? 'virtual-element-popper' : undefined

  const handleMouseLeave = () => {
    // setOpen(false)
  }

  const handleCloseSelect = () => {
    const mainScene = sceneRef.current
    if (mainScene) {
      mainScene.clearSelect()
    }
    setOpen(false)
  }

  return (
    <div ref={(_c) => wrapperRef.current = _c} style={{width: '100%', maxWidth: 800}}>
      <Typography variant="h4" color="success" style={{textAlign: 'center'}}>
        {totalReward} ETH
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
        />
      </Popper>
      <Box style={{ display: 'flex' }} sx={{ border: 1, p: 1, bgcolor: 'background.paper' }}>
        Selected: {`(${select.x}, ${select.y}), [${select.width} x ${select.height}]`}
        <span style={{ flexGrow: 1 }} />
        <ButtonGroup variant="outlined" aria-label="outlined primary button group">
          {/* <Button onClick={mint} size="small">Mint</Button>
          <Button onClick={merge} size="small">Merge</Button> */}
          {/* <Button size="small" component="label">
            Image <input id="chooseImage" hidden type="file" onChange={setImage} />
            </Button>
          <Button size="small" onClick={upload}><FaUpload/></Button> */}
        </ButtonGroup>
        {/* <Button onClick={() => req(pick)} variant='outlined' size="small">Pick</Button> */}
      </Box>
    </div>
  )
}