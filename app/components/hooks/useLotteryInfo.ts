import { useEffect, useState } from 'react'

import { ContractPlatform, getContractDataService, LotteryInfo } from '../../services'

interface LotteryInfoHook {
  lotteryAccount: string
  totalReward: string
  lotteryIndex: number
  lotteryInfo: LotteryInfo | null
  blockNumber: string
}

export function useLotteryInfo(platform: ContractPlatform): LotteryInfoHook {
  const [lotteryAccount, setLotteryAccount] = useState('')
  const [totalReward, setTotalReward] = useState('')
  const [lotteryIndex, setLotteryIndex] = useState(0)
  const [lotteryInfo, setLotteryInfo] = useState<LotteryInfo | null>(null)
  const [blockNumber, setBlockNumber] = useState('')

  useEffect(() => {
    let unsub: Function
    (async () => {
      const service = await getContractDataService(platform)
      const acc = await service.getLotteryAccount()
      setLotteryAccount(acc)

      const index = await service.getLotteryIndex()
      setLotteryIndex(index)

      const info = await service.getLotteryInfo()
      setLotteryInfo(info)

      unsub = await service.subscribeBlockHeader((block) => {
        setBlockNumber(block)
      })
    })()

    return () => {
      if (unsub) { unsub() }
    } 
  }, [platform])

  useEffect(() => {
    let unsub: Function
    (async () => {
      const service = await getContractDataService(platform)
      unsub = await service.subscribeBalance(lotteryAccount, (balance) => {
        setTotalReward(balance)
      })
    })()

    return () => {
      if (unsub) { unsub() }
    }
  }, [lotteryAccount])

  return { lotteryAccount, totalReward, lotteryIndex, lotteryInfo, blockNumber }
}