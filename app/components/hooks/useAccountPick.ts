import { atom, useRecoilState } from 'recoil'

import { type Account, ContractPlatform, getContractDataService, type PickCount } from '../../services'

export const accountPickState = atom<Set<number>>({
  key: 'accountPickState',
  default: new Set()
})

interface AccountPickHook {
  accountPickSet: Set<number>
  loadAccountPick: (account: Account | null) => Promise<void>
}

export function useAccountPick(platform: ContractPlatform): AccountPickHook {
  const [accountPickSet, setAccountPickSet] = useRecoilState(accountPickState)

  const loadAccountPick = async (account: Account | null) => {
    if (account) {
      const service = await getContractDataService(platform)
      const pickSet = await service.getAccountPickedPixels(account.addr)
      setAccountPickSet(new Set(pickSet))
    } else {
      setAccountPickSet(new Set())
    }
  }

  return { accountPickSet, loadAccountPick }
}