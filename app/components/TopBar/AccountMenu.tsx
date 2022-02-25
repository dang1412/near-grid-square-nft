import { useEffect, useState } from 'react'
import { atom, useRecoilState } from 'recoil'

import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

import { useContractDataService } from '../hooks'

export const accountState = atom({
  key: 'accountState',
  default: ''
})

export const AccountMenu: React.FC<{}> = () => {
  const service = useContractDataService()
  const [account, setAccount] = useRecoilState(accountState)
  const [balance, setBalance] = useState(0)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const login = async () => {
    // const _signer = await getMetaSigner()
    // const _addr = await _signer.getAddress()
    // setAccount(_addr)
    if (service) {
      service.signIn()
    }
  }

  const logout = async () => {
    setAccount('')
    setAnchorEl(null)
    if (service) {
      service.signOut()
    }
  }

  useEffect(() => {
    // if (account) {
    //   (async () => {
    //     const provider = getMetaProvider()
    //     const _balance = await provider.getBalance(account)
    //     utils.formatEther(_balance)
    //     setBalance(Number(utils.formatEther(_balance)))
    //   })()
    // } else {
    //   setBalance(0)
    // }
    (async () => {
      if (account && service) {
        const balance = await service.getBalance(account)
        setBalance(balance)
      }
    })()
  }, [account, service])

  useEffect(() => {
    if (service) {
      const account = service.getAuthorizedAccountId()
      setAccount(account)
    } else {
      setAccount('')
    }
  }, [service])

  return (
    <>
      {account ? <Button color="inherit" onClick={handleClick}>{account}</Button> : <Button color="inherit" onClick={login}>Connect</Button>}
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
