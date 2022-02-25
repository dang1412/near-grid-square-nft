export interface ContractDataService {
  // account
  signIn(): Promise<void>
  signOut(): void
  getAuthorizedAccountId(): string
  getBalance(account: string): Promise<number>

  // read
  getPixels(): Promise<any>
  getAccountPixel(account: string): Promise<any>
  getPickedPixels(): Promise<any>
  getAccountPickedPixels(account: string): Promise<any>

  // write
  mintPixels(pixel: number, width: number, height: number): void
  mergePixels(pixel: number, width: number, height: number): void
  pickPixels(pixel: number, width: number, height: number): void
}

export enum ContractPlatform {
  Near,
  Polygon,
  Bsc,
}

const serviceSingleton: {[platform: number]: ContractDataService} = {}

export async function getContractDataService(platform: ContractPlatform): Promise<ContractDataService | undefined> {
  if (!serviceSingleton[platform]) {
    // near
    if (platform === ContractPlatform.Near) {
      // lazy load
      const NearDataService = await import('./near').then(m => m.NearDataService)
      serviceSingleton[platform] = await NearDataService.getInstance()
    }

    // polygon
  }

  return serviceSingleton[platform]
}
