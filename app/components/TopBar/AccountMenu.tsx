import { useEffect, useState } from 'react'
import { atom, useRecoilState, useRecoilValue } from 'recoil'

import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

// import { useContractDataService } from '../hooks'
import { platformState } from '../PlatformSelect'
import { ContractPlatform, getContractDataService } from '../../services'

export const accountState = atom({
  key: 'accountState',
  default: ''
})

export const AccountMenu: React.FC<{}> = () => {
//   const service = useContractDataService()
  const platform = useRecoilValue(platformState)
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

  const setIfLogin = async (_platform: ContractPlatform) => {
    const service = await getContractDataService(_platform)
    if (service) {
      const account = service.getAuthorizedAccountId()
      setAccount(account)
    } else {
      setAccount('')
    }
  }

  const login = async () => {
    // const _signer = await getMetaSigner()
    // const _addr = await _signer.getAddress()
    // setAccount(_addr)
    const service = await getContractDataService(platform)
    if (service) {
      await service.signIn()
      setIfLogin(platform)
    }
  }

  const logout = async () => {
    setAccount('')
    setAnchorEl(null)
    const service = await getContractDataService(platform)
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
      const service = await getContractDataService(platform)
      if (account && service) {
        const balance = await service.getBalance(account)
        setBalance(balance)
      }
    })()
  }, [account, platform])

  useEffect(() => {
    setIfLogin(platform)
  }, [platform])

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
