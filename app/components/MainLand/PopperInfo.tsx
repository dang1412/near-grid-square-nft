import { FaTimes } from 'react-icons/fa'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ButtonGroup from '@mui/material/ButtonGroup'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

export interface PopperInfoProps {
  xCoord: number
  yCoord: number
  selecting: number
  onClose?: () => void
}

export const defaultPopperProps: PopperInfoProps = {
  xCoord: 0,
  yCoord: 0,
  selecting: 0,
}

export const PopperInfo: React.FC<PopperInfoProps> = (props) => {
  const { xCoord, yCoord, selecting, onClose = () => {} } = props

  const mint = () => {}
  const pick = () => {}

  return (
    <Paper style={{textAlign: 'center', padding: '10px 0'}}>
      <IconButton onClick={onClose} size='small' style={{position: 'absolute', right: 0, top: 0}} component="span">
        <FaTimes />
      </IconButton>
      <Typography sx={{ p: 2 }}>({xCoord}, {yCoord}) {selecting} pixels selected</Typography>
      <ButtonGroup variant="outlined" aria-label="outlined primary button group">
        <Button onClick={mint} size="small">Mint</Button>
        <Button onClick={pick} size="small">Pick</Button>
      </ButtonGroup>
    </Paper>
  )
}
