import { useEffect, useState } from 'react'
import { atom, useRecoilState, useRecoilValue } from 'recoil'

import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

import { platformState } from '../PlatformSelect'
import { getContractDataService } from '../../services'
import { useLogin } from '../hooks'

export const AccountMenu: React.FC<{}> = () => {
  const platform = useRecoilValue(platformState)
  const [balance, setBalance] = useState(0)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const [login, setIfLogin, dologout, account] = useLogin(platform)

  const logout = () => {
    dologout()
    setAnchorEl(null)
  }

  useEffect(() => {
    (async () => {
      const service = await getContractDataService(platform)
      if (account && service) {
        const balance = await service.getBalance(account)
        setBalance(balance)
      }
    })()
  }, [account, platform])

  useEffect(() => {
    setIfLogin()
  }, [platform])

  return (
    <>
      {account ? <Button color="inherit" onClick={handleClick}>{account}</Button> : <Button color="inherit" onClick={() => login()}>Connect</Button>}
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem>{balance}</MenuItem>
        <MenuItem onClick={logout}>Logout</MenuItem>
      </Menu>
    </>
  )
}
