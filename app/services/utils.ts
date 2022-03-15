export enum ContractPlatform {
  Substrate,
  Near,
  Polygon,
  Bsc,
}

const platformNativeTokenMap = {
  [ContractPlatform.Substrate]: 'DOT',
  [ContractPlatform.Near]: 'NEAR',
  [ContractPlatform.Polygon]: 'MATIC',
  [ContractPlatform.Bsc]: 'BNB',
}

export function getNativeToken(platform: ContractPlatform): string {
  return platformNativeTokenMap[platform] || ''
}
