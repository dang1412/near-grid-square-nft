import { useEffect, useRef, useState } from 'react'
import { Sprite } from 'pixi.js'
import { DropShadowFilter } from '@pixi/filter-drop-shadow'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'

import { useContractDataService } from '../hooks'
import { coordinateToIndex, GameEngine, GameSceneViewport, indexToCoordinate, iterateSelect, SelectionRect } from '../../lib'

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

export const MainLand: React.FC<{}> = () => {
  const service = useContractDataService()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<GameSceneViewport | null>(null)

  const [select, setSelect] = useState<SelectionRect>({x: 0, y: 0, width: 0, height: 0})
  const [totalReward, setTotalReward] = useState('1000')

  useEffect(() => {
    (async () => {
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
        onSelectOutput: (select) => {
          // const [wx, wy] = gridToWorldCoord(select.x, select.y)
          // setSelect({...select, x: wx, y: wy})
          setSelect(select)
        }
      })

      engine.changeScene(mainScene.sceneIndex)

      sceneRef.current = mainScene

      const tokens = await service.getPixels()
      for (const token of tokens) {
        const [wx, wy] = indexToCoordinate(Number(token.id))
        const [x, y] = [wx + WORLD_SIZE / 2, wy + WORLD_SIZE / 2]
        const pixel = mainScene.addGridSprite(x, y, 'mint')
        pixel.width = PIXEL_SIZE * token.width
        pixel.height = PIXEL_SIZE * token.height
        pixel.tint = 0xababab
        pixel.alpha = token.width * token.height > 1 ? 0.8 : 0.6

        // pixel.interactive = true
        // pixel.on('mouseover', () => makeSpriteFloat(pixel))
        // pixel.on('pointerout', () => undoSpriteFloat(pixel))
      }
    })()
  }, [service])

  const mint = async () => {
    const mainScene = sceneRef.current
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

  const merge = async () => {
    const mainScene = sceneRef.current
    if (service && mainScene) {
      const token = coordinateToIndex(select.x - WORLD_SIZE / 2, select.y - WORLD_SIZE / 2)
      await service.mergePixels(token, select.width, select.height)

      const pixel = mainScene.addGridSprite(select.x, select.y, 'mint')
      pixel.width = PIXEL_SIZE * select.width
      pixel.height = PIXEL_SIZE * select.height
      pixel.alpha = 0.8

      iterateSelect(select, (x, y) => {
        if (x === select.x && y === select.y) { return }
        const pixel = mainScene.addGridSprite(x, y, 'mint')
        pixel.parent.removeChild(pixel)
      })
    }
  }

  return (
    <div ref={(_c) => wrapperRef.current = _c} style={{width: '100%', maxWidth: 800}}>
      <Typography variant="h4" color="success" style={{textAlign: 'center'}}>
        {totalReward} ETH
      </Typography>
        <canvas ref={(_c) => canvasRef.current = _c} style={{backgroundColor: 'grey'}} />
      <Box style={{ display: 'flex' }} sx={{ border: 1, p: 1, bgcolor: 'background.paper' }}>
        Selected: {`(${select.x}, ${select.y}), [${select.width} x ${select.height}]`}
        <span style={{ flexGrow: 1 }} />
        <ButtonGroup variant="outlined" aria-label="outlined primary button group">
          <Button onClick={mint} size="small">Mint</Button>
          <Button onClick={merge} size="small">Merge</Button>
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