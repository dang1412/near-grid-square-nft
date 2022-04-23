import { create } from 'ipfs-http-client'

export async function uploadIPFS(file: File): Promise<string> {
  let ipfs = await create({
    url: 'https://ipfs.infura.io:5001/api/v0',
  })
  const { cid } = await ipfs.add(file)
  // https://ipfs.infura.io/ipfs/
  const cidStr = cid.toString()
  const url = `https://ipfs.infura.io/ipfs/${cidStr}`
  console.log(url)

  return cidStr
}
