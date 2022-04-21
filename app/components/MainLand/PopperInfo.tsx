import { useRecoilValue } from 'recoil'
import { FaTimes } from 'react-icons/fa'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

import { type Pixel } from '../../services'
import { useLogin, usePixelData } from '../hooks'
import { platformState } from '../PlatformSelect'
import { coordinateToIndex } from '../../lib'

export interface PopperInfoProps {
  x: number
  y: number
  w: number
  h: number
  onClose?: () => void
  onMintClick?: () => void
  onPickClick?: () => void
}

export const defaultPopperProps: PopperInfoProps = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

export const PopperInfo: React.FC<PopperInfoProps> = (props) => {
  const { x, y, w, h, onClose = () => {}, onMintClick, onPickClick } = props

  const platform = useRecoilValue(platformState)
  const {login, account} = useLogin(platform)

  const { pixelMap } = usePixelData(platform)

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
        </>
      ) : (
        <>
          <Typography sx={{ p: 2 }}>({x}, {y}) {'->'} ({x + w - 1}, {y + h - 1}) {w * h} pixels selected</Typography>
          {account ? (
            <ButtonGroup variant="outlined" aria-label="outlined primary button group">
              <Button onClick={mint} size="small">Mint</Button>
              <Button onClick={pick} size="small">Pick</Button>
            </ButtonGroup>
          ) : (
            <Button variant="outlined" onClick={connect} size="small">Connect</Button>
          )}
        </>
      )}
      

    </Paper>
  )
}
