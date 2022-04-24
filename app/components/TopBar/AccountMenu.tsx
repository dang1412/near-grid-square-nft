import { useEffect, useRef, useState } from 'react'
import { useRecoilValue } from 'recoil'

import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'

import { platformState } from '../PlatformSelect'
import { Account, getContractDataService } from '../../services'
import { useLogin } from '../hooks'
import { FaAngleDown } from 'react-icons/fa'
import MenuList from '@mui/material/MenuList'

export const AccountMenu: React.FC<{}> = () => {
  const platform = useRecoilValue(platformState)
  const [balance, setBalance] = useState('0')

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const { login, logout: dologout, account, setAccount, accounts } = useLogin(platform)

  const logout = () => {
    dologout()
    setAnchorEl(null)
  }

  // update balance
  useEffect(() => {
    (async () => {
      const service = await getContractDataService(platform)
      if (account && service) {
        const balance = await service.getBalance(account.addr)
        setBalance(balance)
      }
    })()
  }, [account, platform])

  // set login initially if remembered
  // useEffect(() => {
  //   setIfLogin()
  // }, [platform])

  // select accounts
  const [openAccountSelect, setOpenAccountSelect] = useState(false)
  const handleToggle = () => {
    setOpenAccountSelect(!openAccountSelect)
  }

  const anchorRef = useRef(null);
  const pickAccount = async (acc: Account) => {
    const service = await getContractDataService(platform)
    service.setCurrentAccount(acc)
    setAccount(acc)
    handleToggle()
  }

  return (
    <>
      {account ? (
        // Name and dropdown button
        <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
          <Button onClick={handleClick}>{account.name}</Button>
          <Button
            size="small"
            aria-controls={openAccountSelect ? 'split-button-menu' : undefined}
            aria-expanded={openAccountSelect ? 'true' : undefined}
            aria-label="select merge strategy"
            aria-haspopup="menu"
            onClick={handleToggle}
          >
            <FaAngleDown />
          </Button>
        </ButtonGroup>
      ) : (
        // Connect button
        <Button color="inherit" onClick={() => login()}>Connect</Button>
      )}

      {/* Account Info Menu */}
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

      {/* Account List Menu */}
      <Menu
        id="menu-2"
        anchorEl={anchorRef.current}
        open={openAccountSelect}
        onClose={handleToggle}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuList id="split-button-menu" autoFocusItem>
          {accounts.map((account) => (
            <MenuItem
              key={account.name}
              onClick={() => pickAccount(account)}
            >
              {account.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </>
  )
}
