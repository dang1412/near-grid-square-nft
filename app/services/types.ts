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
