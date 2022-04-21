import { connect, keyStores, type Near, type ConnectConfig, WalletConnection, providers, utils, Account as NearAccount } from 'near-api-js'

import { type Account, ContractDataService, Pixel } from '..'

const keyStore = new keyStores.BrowserLocalStorageKeyStore()
const contractId = 'pixelland.dang1412.testnet'
const nodeUrl = 'https://rpc.testnet.near.org'

const config: ConnectConfig = {
  networkId: 'testnet',
  keyStore, // optional if not signing transactions
  nodeUrl,
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  // explorerUrl: 'https://explorer.testnet.near.org',
  headers: {}
}

const provider = new providers.JsonRpcProvider(nodeUrl)

export class NearDataService implements ContractDataService {
  static async getInstance(): Promise<NearDataService> {
    const near = await connect(config)
    const account = await near.account('example-account.testnet')
    return new NearDataService(near, account)
  }

  private wallet: WalletConnection
  // private contract: Contract

  constructor(private near: Near, rootAcc: NearAccount) {
    this.wallet = new WalletConnection(near, '')
    // let t = new Contract(
    //   rootAcc,
    //   contractAddress,
    //   {
    //     viewMethods: ['get_not_covered_tokens'],
    //     changeMethods: ['']
    //   }
    // )

    // t.
  }

  async getBalance(account: string): Promise<string> {
    const acc = await this.near.account(account)
    const balance = await acc.getAccountBalance()
    console.log(balance)

    return utils.format.formatNearAmount(balance.available)
  }

  async signIn(): Promise<void> {
    await this.wallet.requestSignIn('pixelland.dang1412.testnet')
  }

  signOut(): void {
    this.wallet.signOut()
  }

  getCurrentAccount(): Account | null {
    // return this.wallet.getAccountId()
    return null
  }

  setCurrentAccount(account: Account) {}

  getAccounts(): Account[] {
    return []
  }

  async login(): Promise<void> {
    const rs = await this.wallet.requestSignIn(contractId)
  }

  async getPixels(): Promise<Pixel[]> {
    // throw new Error('Method not implemented.');
    // const data = await this.contract.get()
    // const connectedAccountId: string = this.wallet.getAccountId()
    // const account = await this.near.account(connectedAccountId)
    // const rs = await account.functionCall({
    //   contractId,
    //   args: {},
    //   methodName: 'get_not_covered_tokens'
    // })

    const rawResult = await provider.query({
      request_type: 'call_function',
      account_id: contractId,
      method_name: 'get_not_covered_tokens',
      args_base64: 'e30=',
      finality: 'optimistic',
    });

    const res: any[] = JSON.parse(Buffer.from((rawResult as any).result).toString());
    console.log(res)
    return res.map(p => ({...p, id: Number(p.token_id)}))
  }

  async getAccountPixel(account: string): Promise<any> {
  }

  async getPickedPixels(): Promise<any> {
  }

  getAccountPickedPixels(account: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async mintPixels(pixel: number, width: number, height: number): Promise<void> {
    console.log('mintPixels', pixel, width, height)
    const acc = this.wallet.account()
    const cost = 1000 * width * height
    await acc.functionCall({
      contractId,
      args: {
        token_id: `${pixel}`,
        width,
        height,
        receiver_id: acc.accountId,
        token_metadata: {},
      },
      methodName: 'nft_batch_mint',
      attachedDeposit: `${cost}` as any
    })
  }

  mergePixels(pixel: number, width: number, height: number): void {
    console.log('mergePixels', pixel, width, height)
  }

  pickPixels(pixel: number, width: number, height: number): void {
    console.log('pickPixels', pixel, width, height)
  }

}
