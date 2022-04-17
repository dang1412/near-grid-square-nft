import { atom, useRecoilState } from 'recoil'

import { ContractPlatform, getContractDataService } from '../../services'
// import { accountState } from '../TopBar/AccountMenu'

export const accountState = atom({
  key: 'accountState',
  default: ''
})

export function useLogin(platform: ContractPlatform): [Function, Function, Function, string, Function] {
  const [account, setAccount] = useRecoilState(accountState)

  const setIfLogin = async () => {
    const service = await getContractDataService(platform)
    if (service) {
      const account = service.getAuthorizedAccountId()
      setAccount(account)
    } else {
      setAccount('')
    }
  }

  const login = async () => {
    const service = await getContractDataService(platform)
    if (service) {
      await service.signIn()
      setIfLogin()
    }
  }

  const logout = async () => {
    setAccount('')
    const service = await getContractDataService(platform)
    if (service) {
      service.signOut()
    }
  }

  return [login, setIfLogin, logout, account, setAccount]
}