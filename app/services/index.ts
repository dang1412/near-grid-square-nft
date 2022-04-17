import { ContractPlatform } from './utils'

export interface ContractDataService {
  // account
  signIn(): Promise<void>
  signOut(): void
  getAuthorizedAccountId(): string
  getBalance(account: string): Promise<number>

  // read
  getPixels(): Promise<Pixel[]>
  getAccountPixel(account: string): Promise<any>
  getPickedPixels(): Promise<any>
  getAccountPickedPixels(account: string): Promise<any>

  // write
  mintPixels(pixel: number, width: number, height: number): void
  mergePixels(pixel: number, width: number, height: number): void
  pickPixels(pixel: number, width: number, height: number): void
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

export interface Pixel {
  pixelId: number
  image?: string
  price?: number
  owner: string
  dateMinted: string
}
