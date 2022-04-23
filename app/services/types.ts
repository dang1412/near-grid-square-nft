export interface Account {
  addr: string
  name: string
}
  
export interface Pixel {
  pixelId: number
  image?: string
  price?: number
  owner: string
  dateMinted: string
}

export interface PickCount {
  pixelId: number
  count: number
}

export interface PixelImage {
  pixelId: number
  cid: string
  w: number
  h: number
}

export interface LotteryInfo {
  price: string
  start: number
  length: number
  delay: number
}
