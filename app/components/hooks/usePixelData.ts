import { useState } from 'react'
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

  return { pixelMap, loadPixels, updatePixelMap }
}