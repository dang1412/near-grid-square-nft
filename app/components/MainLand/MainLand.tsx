import { useCallback, useEffect, useRef, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { DropShadowFilter } from '@pixi/filter-drop-shadow'
import { VirtualElement } from '@popperjs/core'

import Typography from '@mui/material/Typography'
import Popper from '@mui/material/Popper'

import { coordinateToIndex, GameEngine, GameSceneViewport, getIndexArray, SelectionRect } from '../../lib'
import { getContractDataService } from '../../services'
import { platformState } from '../PlatformSelect'
import { PixelMap, useAccountPick, useLogin, useLotteryInfo, usePickCount, usePixelData } from '../hooks'
import { PopperInfo } from './PopperInfo'
import { uploadIPFS } from './upload-ipfs'
import { getVirtualElement, pixelToMapXY, PIXEL_SIZE, reflectImages, reflectMintedPixels, reflectPickedPixels, reflectPickedXY, WORLD_SIZE } from './utils'
import { loadMock } from './mock'

// function gridToWorldCoord(gx: number, gy: number): [number, number] {
//   const wx = gx - WORLD_SIZE / 2
//   const wy = gy - WORLD_SIZE / 2

//   return [wx, wy]
// }

export const MainLand: React.FC<{}> = () => {
  const platform = useRecoilValue(platformState)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<GameSceneViewport | null>(null)

  const [select, setSelect] = useState<SelectionRect>({x: 0, y: 0, width: 0, height: 0})

  // pixel data
  const { pixelMap, loadPixels, updatePixelMap } = usePixelData(platform)
  const { account } = useLogin(platform)

  // pick data
  const { pickCountMap, loadPickCount } = usePickCount(platform)
  const { accountPickSet, loadAccountPick } = useAccountPick(platform)

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

      // load mock data
      loadMock(mainScene)

      // add layer in order: mint, image, pick
      try {
        await loadPixels()
        const images = await service.getPixelImages()
        reflectImages(mainScene, images)
        await loadPickCount()
      } catch (e) {
      }
    })()
  }, [platform])

  // reflect minted pixels on map
  useEffect(() => {
    const mainScene = sceneRef.current
    if (mainScene) {
      reflectMintedPixels(mainScene, Object.values(pixelMap), account)
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

      const { x, y, width, height } = select
      // clear select
      handleCloseSelect()

      // upload to ipfs
      const cid = await uploadIPFS(file)

      // set image onchain
      const pixel = coordinateToIndex(x - WORLD_SIZE / 2, y - WORLD_SIZE / 2)
      await service.setPixelImage(pixel, cid, width, height)
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
      <Typography variant="body1" color="success" textAlign={'center'}>
        Scroll mouse to zoom, A W S D to move (when zoom in)
      </Typography>
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
      <Typography variant="h4" color="success" textAlign={'center'}>
        Pixel NFT holder
      </Typography>
      <div>
        - Showing advertising picture <br/>
        - Receive a portion of fee <br/>
        - Receive a portion of total reward <br/>
      </div>
      <Typography variant="h4" color="success" textAlign={'center'}>
        Development path
      </Typography>
      <div>
        - Crosschain <br/>
        - Dao to control game rules <br/>
        - More games <br/>
        - Metaverse 2D <br/>
      </div>
    </div>
  )
}