import { atom, useRecoilState } from 'recoil'

import { ContractPlatform, getContractDataService, type Account } from '../../services'

export const accountState = atom<Account | null>({
  key: 'accountState',
  default: null
})

interface LoginHook {
  login: () => Promise<void>,
  // setIfLogin: () => Promise<void>,
  logout: () => Promise<void>,
  account: Account | null,
  setAccount: Function,
  accounts: Account[],
}

let accounts: Account[] = []

export function useLogin(platform: ContractPlatform): LoginHook {
  const [account, setAccount] = useRecoilState(accountState)

  // const setIfLogin = async () => {
  //   const service = await getContractDataService(platform)
  //   if (service) {
  //     const account = service.getCurrentAccount()
  //     accounts = service.getAccounts()
  //     setAccount(account)
  //   }
  // }

  const login = async () => {
    const service = await getContractDataService(platform)
    if (service) {
      await service.signIn()
      const account = service.getCurrentAccount()
      accounts = service.getAccounts()
      setAccount(account)
      // setIfLogin()
    }
  }

  const logout = async () => {
    const service = await getContractDataService(platform)
    if (service) {
      service.signOut()
    }
    setAccount(null)
    accounts = []
  }

  return { login, logout, account, setAccount, accounts }
}
