import { useState } from 'react'

import { ContractPlatform, getContractDataService, type PickCount } from '../../services'

type PickCountMap = {[pixelId: number]: PickCount}

interface PickCountHook {
  pickCountMap: PickCountMap
  loadPickCount: () => Promise<void>
}

export function usePickCount(platform: ContractPlatform): PickCountHook {
  const [pickCountMap, setPickCountMap] = useState<PickCountMap>({})

  const loadPickCount = async () => {
    const service = await getContractDataService(platform)
    const pickCounts = await service.getPickedPixels()

    const countMap: PickCountMap = {}
    for (const pickCount of pickCounts) {
      countMap[pickCount.pixelId] = pickCount
    }

    setPickCountMap(countMap)
  }

  return { pickCountMap, loadPickCount }
}
