import { FaTimes } from 'react-icons/fa'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

import { useLogin } from '../hooks'
import { useRecoilValue } from 'recoil'
import { platformState } from '../PlatformSelect'

export interface PopperInfoProps {
  xCoord: number
  yCoord: number
  w: number
  h: number
  onClose?: () => void
  onMintClick?: () => void
  onPickClick?: () => void
}

export const defaultPopperProps: PopperInfoProps = {
  xCoord: 0,
  yCoord: 0,
  w: 0,
  h: 0,
}

export const PopperInfo: React.FC<PopperInfoProps> = (props) => {
  const { xCoord, yCoord, w, h, onClose = () => {}, onMintClick, onPickClick } = props
  
  const platform = useRecoilValue(platformState)
  const [login, _, __, account] = useLogin(platform)

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
      <Typography sx={{ p: 2 }}>({xCoord}, {yCoord}) {'->'} ({xCoord + w - 1}, {yCoord + h - 1}) {w * h} pixels selected</Typography>
      {account ? (
        <ButtonGroup variant="outlined" aria-label="outlined primary button group">
          <Button onClick={mint} size="small">Mint</Button>
          <Button onClick={pick} size="small">Pick</Button>
        </ButtonGroup>
      ) : (
        <Button variant="outlined" onClick={connect} size="small">Connect</Button>
      )}
      
    </Paper>
  )
}
