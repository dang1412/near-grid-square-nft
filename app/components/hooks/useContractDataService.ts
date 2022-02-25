import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'

import { type ContractDataService, getContractDataService } from '../../services'
import { platformState } from '../PlatformSelect'

export function useContractDataService(): ContractDataService | undefined {
  const platform = useRecoilValue(platformState)
  const [service, setService] = useState<ContractDataService | undefined>(undefined)

  useEffect(() => {
    console.log(platform)
    getContractDataService(platform).then(setService)
  }, [platform])

  return service
}