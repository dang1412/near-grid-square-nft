import { useRecoilValue } from 'recoil'
import { FaTimes } from 'react-icons/fa'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

import { type Account, type Pixel } from '../../services'
import { PixelMap, useAccountPick, useLogin, usePixelData } from '../hooks'
import { platformState } from '../PlatformSelect'
import { coordinateToIndex, getIndexArray } from '../../lib'
import { ChangeEvent } from 'react'

export interface PopperInfoProps {
  x: number
  y: number
  w: number
  h: number
  onClose?: () => void
  onMintClick?: () => void
  onPickClick?: () => void
  onSelectImage?: (image: HTMLImageElement) => void
}

export const defaultPopperProps: PopperInfoProps = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

const isMintable = (pixelMap: PixelMap, pixelIds: number[]) => {
  for (const pixelId of pixelIds) {
    if (pixelMap[pixelId]) return false
  }

  return true
}

const isPickable = (pickedSet: Set<number>, pixelIds: number[]) => {
  for (const pixelId of pixelIds) {
    if (pickedSet.has(pixelId)) return false
  }

  return true
}

const isUploadable = (pixelMap: PixelMap, pixelIds: number[], account: Account | null) => {
  if (!account) return false

  for (const pixelId of pixelIds) {
    const owner = pixelMap[pixelId] ? pixelMap[pixelId].owner : ''
    if (owner !== account.addr) return false
  }

  return true
}

export const PopperInfo: React.FC<PopperInfoProps> = (props) => {
  const { x, y, w, h, onClose = () => {}, onMintClick, onPickClick, onSelectImage } = props

  const platform = useRecoilValue(platformState)
  const { login, account } = useLogin(platform)

  const { pixelMap } = usePixelData(platform)
  const { accountPickSet } = useAccountPick(platform)

  // check mintable, pickable
  const pixel = coordinateToIndex(x, y)
  const pixelIds = getIndexArray(pixel, w, h)
  const mintable = isMintable(pixelMap, pixelIds)
  const pickable = isPickable(accountPickSet, pixelIds)
  const uploadable = isUploadable(pixelMap, pixelIds, account)

  let pixelInfo: Pixel | null = null
  if (w * h === 1) {
    const index = coordinateToIndex(x, y)
    pixelInfo = pixelMap[index]
  }

  const mint = () => {
    if (onMintClick) {
      onMintClick()
    }
    onClose()
  }

  const pick = () => {
    if (onPickClick) {
      onPickClick()
    }
    onClose()
  }

  const connect = () => {
    login()
  }

  const setImage = (event: ChangeEvent<HTMLInputElement>) => {
    if (event && event.currentTarget && event.currentTarget.files && event.currentTarget.files[0]) {
      const file = event.currentTarget.files[0];
      // setFile(file)
      const image = new Image()
      image.src = URL.createObjectURL(file)
      image.onload = () => {
        // sceneRef.current?.setSelectingImage(image)
        if (onSelectImage) {
          onSelectImage(image)
        }
      }
    }
  }

  return (
    <Paper style={{textAlign: 'center', padding: '10px 0'}}>
      <IconButton onClick={onClose} size='small' style={{position: 'absolute', right: 0, top: 0}} component="span">
        <FaTimes />
      </IconButton>
      {pixelInfo ? (
        <>
          <Typography sx={{ p: 2 }}>
            Minted: {pixelInfo.pixelId}<br/>
            Owner: {pixelInfo.owner}
          </Typography>
          {account && pickable ? <Button variant="outlined" onClick={pick} size="small">Pick</Button> : <></>}
        </>
      ) : (
        <>
          <Typography sx={{ p: 2 }}>({x}, {y}) {'->'} ({x + w - 1}, {y + h - 1}) {w * h} pixels selected</Typography>
          {account ? (
            <>
              {mintable ? <Button variant="outlined" onClick={mint} size="small">Mint</Button> : <></>}
              {pickable ? <Button variant="outlined" onClick={pick} size="small">Pick</Button> : <></>}
            </>
          ) : (
            <Button variant="outlined" onClick={connect} size="small">Connect</Button>
          )}
        </>
      )}
      {uploadable ? (
          // <Button variant="outlined" onClick={() => {}} size="small">Image</Button>
          <Button variant="contained" component="label" size="small">
            Image
            <input id="chooseImage" type="file" hidden onChange={setImage} />
          </Button>
        ) : <></>
      }

    </Paper>
  )
}
