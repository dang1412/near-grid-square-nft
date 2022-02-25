import Link from 'next/link'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import { AccountMenu } from './AccountMenu'
import { PlatformSelect } from '../PlatformSelect'

export const TopBar: React.FC<{}> = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Link href="/">
            <Typography variant="h6" component="div" style={{marginRight: 5, cursor: 'pointer'}}>
              PixelLand
            </Typography>
          </Link>
          <Link href="/guide">
            <Button color="inherit">Guide</Button>
          </Link>
          <span style={{ flexGrow: 1 }} />
          <PlatformSelect />
          <AccountMenu />
          {/* {account ? <Button color="inherit" onClick={logout}>{account}</Button> : <Button color="inherit" onClick={login}>Connect</Button>} */}
        </Toolbar>
      </AppBar>
    </Box>
  )
}
