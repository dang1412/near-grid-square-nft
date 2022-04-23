import { Account, PickCount, Pixel, PixelImage } from './types'
import { ContractPlatform } from './utils'

export interface ContractDataService {
  // account
  signIn(): Promise<void>
  signOut(): void
  getAccounts(): Account[]
  getCurrentAccount(): Account | null
  setCurrentAccount(account: Account): void
  getBalance(account: string): Promise<string>

  // read
  getPixels(): Promise<Pixel[]>
  getLotteryIndex(): Promise<number>
  getLotteryAccount(): Promise<string>
  getAccountPixel(account: string): Promise<number[]>
  getPickedPixels(): Promise<PickCount[]>
  getAccountPickedPixels(account: string): Promise<number[]>
  getPixelImages(): Promise<PixelImage[]>

  // write
  mintPixels(pixel: number, width: number, height: number): void
  mergePixels(pixel: number, width: number, height: number): void
  pickPixels(pixel: number, width: number, height: number): void
  setPixelImage(pixel: number, cid: string, width: number, height: number): void
}

const serviceSingleton: {[platform: number]: Promise<ContractDataService>} = {}

export async function getContractDataService(platform: ContractPlatform): Promise<ContractDataService> {
  if (!serviceSingleton[platform]) {
    // substrate
    if (platform === ContractPlatform.Substrate) {
      // lazy load
      serviceSingleton[platform] = new Promise((resolve) => {
        import('./substrate').then(m => m.SubstrateDataService).then(SubstrateDataService => new SubstrateDataService()).then(resolve)
      })
    }

    // near
    if (platform === ContractPlatform.Near) {
      // lazy load
      // const NearDataService = await import('./near').then(m => m.NearDataService)
      // serviceSingleton[platform] = await NearDataService.getInstance()
      serviceSingleton[platform] = new Promise((resolve) => {
        import('./near').then(m => m.NearDataService).then(NearDataService => NearDataService.getInstance()).then(resolve)
      })
    }

    // polygon
  }

  return serviceSingleton[platform]
}

export * from './utils'
export * from './types'