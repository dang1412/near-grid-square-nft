import { useRecoilValue } from 'recoil'
import { FaTimes, FaUpload } from 'react-icons/fa'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

import { type Account, type Pixel } from '../../services'
import { PixelMap, useAccountPick, useLogin, pixelState } from '../hooks'
import { platformState } from '../PlatformSelect'
import { coordinateToIndex, getIndexArray } from '../../lib'
import { ChangeEvent, useMemo, useState } from 'react'

export interface PopperInfoProps {
  x: number
  y: number
  w: number
  h: number
  onClose?: () => void
  onMintClick?: () => void
  onPickClick?: () => void
  onSelectImage?: (image: HTMLImageElement) => void
  onUploadClick?: (file: File) => void
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
  const { x, y, w, h, onClose = () => {}, onMintClick, onPickClick, onSelectImage, onUploadClick } = props

  const platform = useRecoilValue(platformState)
  const { login, account } = useLogin(platform)

  const pixelMap = useRecoilValue(pixelState)
  const { accountPickSet } = useAccountPick(platform)

  // check mintable, pickable
  const pixel = useMemo(() => coordinateToIndex(x, y), [x, y])
  const pixelIds = useMemo(() => getIndexArray(pixel, w, h), [pixel, w, h])
  const mintable = useMemo(() => isMintable(pixelMap, pixelIds), [pixelMap, pixelIds])
  const pickable = useMemo(() => isPickable(accountPickSet, pixelIds), [accountPickSet, pixelIds])
  const uploadable = useMemo(() => isUploadable(pixelMap, pixelIds, account), [pixelMap, pixelIds, account])

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

  // image file
  const [file, setFile] = useState<File | null>(null)

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    if (event && event.currentTarget && event.currentTarget.files && event.currentTarget.files[0]) {
      const file = event.currentTarget.files[0];
      // setFile(file)
      const image = new Image()
      image.src = URL.createObjectURL(file)
      image.onload = () => {
        if (onSelectImage) {
          onSelectImage(image)
        }
        setFile(file)
      }
    }
  }

  const upload = () => {
    if (!file) return
    if (onUploadClick) {
      onUploadClick(file)
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
          <ButtonGroup variant="outlined">
            <Button variant="contained" component="label" size="small">
              Image
              <input id="chooseImage" type="file" hidden onChange={selectImage} />
            </Button>
            <Button onClick={upload} size="small" disabled={!file}><FaUpload/></Button>
          </ButtonGroup>
        ) : <></>
      }

    </Paper>
  )
}
