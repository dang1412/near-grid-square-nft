import { atom, useRecoilState } from 'recoil'

import { ContractPlatform, getContractDataService, type Pixel } from '../../services'

type PixelMap = {[pixelId: number]: Pixel}

export const pixelState = atom<PixelMap>({
  key: 'pixelState',
  default: {}
})

interface PixelHook {
  pixelMap: PixelMap
  loadPixels: () => any
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

  return { pixelMap, loadPixels }
}