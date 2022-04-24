import { atom, useRecoilState } from 'recoil'

import { ContractPlatform, getContractDataService, type Pixel } from '../../services'

export type PixelMap = {[pixelId: number]: Pixel}

export const pixelState = atom<PixelMap>({
  key: 'pixelState',
  default: {}
})

interface PixelHook {
  pixelMap: PixelMap
  loadPixels: () => void
  updatePixelMap: (update: PixelMap) => void
}

export function usePixelData(platform: ContractPlatform): PixelHook {
  const [pixelMap, setPixelMap] = useRecoilState(pixelState)

  const loadPixels = async () => {
    const service = await getContractDataService(platform)
    const pixels = await service.getPixels()
    const pMap: PixelMap = {}
    for (const pixel of pixels) {
      pMap[pixel.pixelId] = pixel
    }

    setPixelMap(pMap)
  }

  const updatePixelMap = (update: PixelMap) => {
    setPixelMap({...pixelMap, ...update})
  }

  // useEffect(() => {
  //   let unsub: Function
  //   (async () => {
  //     const service = await getContractDataService(platform)
  //     service.subscribePixels((pixels) => {
  //       console.log('subscribePixels', pixels)
  //     })
  //   })()

  //   return () => {
  //     console.log('unsub')
  //     if (unsub) unsub()
  //   }
  // }, [platform])

  return { pixelMap, loadPixels, updatePixelMap }
}