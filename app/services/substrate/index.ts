import jsonrpc from '@polkadot/types/interfaces/jsonrpc'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import { keyring as Keyring } from '@polkadot/ui-keyring'
import { isTestChain } from '@polkadot/util'
import { TypeRegistry } from '@polkadot/types/create'
import { KeyringPair } from '@polkadot/keyring/types'

import { ContractDataService, Pixel } from '..'

const config = {
  APP_NAME: 'substrate-front-end-template',
  CUSTOM_RPC_METHODS: {},
  PROVIDER_SOCKET: 'ws://127.0.0.1:9944',
}

const parsedQuery = new URLSearchParams(window.location.search)
const connectedSocket = parsedQuery.get('rpc') || config.PROVIDER_SOCKET

enum ApiState {
  CONNECT_INIT,
  CONNECTING,
  READY,
  ERROR,
}

enum KeyringState {
  NONE,
  LOADING,
  READY,
  ERROR,
}

const registry = new TypeRegistry()

const retrieveChainInfo = async (api: ApiPromise) => {
  const [systemChain, systemChainType] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.chainType
      ? api.rpc.system.chainType()
      : Promise.resolve(registry.createType('ChainType', 'Live')),
  ])

  return {
    systemChain: (systemChain || '<unknown>').toString(),
    systemChainType,
  }
}

const loadAccounts = (api: ApiPromise, keyringStateUpdate: (state: KeyringState) => void) => {
  keyringStateUpdate(KeyringState.LOADING)

  const asyncLoadAccounts = async () => {
    try {
      await web3Enable(config.APP_NAME)
      let allAccounts = await web3Accounts()

      allAccounts = allAccounts.map(({ address, meta }) => ({
        address,
        meta: { ...meta, name: `${meta.name} (${meta.source})` },
      }))

      // Logics to check if the connecting chain is a dev chain, coming from polkadot-js Apps
      // ref: https://github.com/polkadot-js/apps/blob/15b8004b2791eced0dde425d5dc7231a5f86c682/packages/react-api/src/Api.tsx?_pjax=div%5Bitemtype%3D%22http%3A%2F%2Fschema.org%2FSoftwareSourceCode%22%5D%20%3E%20main#L101-L110
      const { systemChain, systemChainType } = await retrieveChainInfo(api)
      const isDevelopment =
        (systemChainType as any).isDevelopment ||
        (systemChainType as any).isLocal ||
        isTestChain(systemChain)

      Keyring.loadAll({ isDevelopment }, allAccounts)

      keyringStateUpdate(KeyringState.READY)
    } catch (e) {
      console.error(e)
      keyringStateUpdate(KeyringState.ERROR)
    }
  }
  asyncLoadAccounts()
}

function rawObjToPixel(obj: {[key: string]: any}): Pixel {
  return {
    id: obj.id,
    width: Number(obj.width),
    height: Number(obj.height),
    mergedTo: obj.mergedTo
  }
}

export class SubstrateDataService implements ContractDataService {
  _api: ApiPromise
  _apiState = ApiState.CONNECT_INIT
  _keyringState = KeyringState.NONE
  _acc: KeyringPair | null = null

  constructor() {
    const provider = new WsProvider(connectedSocket)
    const _api = this._api = new ApiPromise({ provider, rpc: jsonrpc })

    // Set listeners for disconnection and reconnection event.
    _api.on('connected', () => {
      this._apiState = ApiState.CONNECTING
      // `ready` event is not emitted upon reconnection and is checked explicitly here.
      _api.isReady.then(_api => this._onApiReady())
    })
    _api.on('ready', () => this._onApiReady())
    _api.on('error', err => this._apiState = ApiState.ERROR)
  }

  private _onApiReady() {
    this._apiState = ApiState.READY
    console.log('_onApiReady')
    if (this._keyringState === KeyringState.NONE) {
      this._keyringState = KeyringState.LOADING
      console.log('loadAccounts')
      loadAccounts(this._api, (state) => this._keyringState = state)
    }
  }

  async signIn(): Promise<void> {
    const accs = Keyring.getPairs()
    console.log(accs)
    this._acc = accs[0]
  }

  signOut(): void {
    this._acc = null
    // throw new Error('Method not implemented.');
  }

  getAuthorizedAccountId(): string {
    return this._acc?.address || ''
  }

  async getBalance(account: string): Promise<number> {
    return 100
  }

  async getPixels(): Promise<Pixel[]> {
    await this._api.isReady
    const entries = await this._api.query.substratePixel.pixels.entries()
    const pixels = entries.map(([{ args }, value]) => {
      const raw: any = value.toHuman()
      return rawObjToPixel(raw)
    })

    console.log(pixels)
    return pixels.filter(p => !p.mergedTo)
  }

  getAccountPixel(account: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getPickedPixels(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getAccountPickedPixels(account: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
  async mintPixels(pixel: number, width: number, height: number) {
    if (this._acc) {
      console.log('mint', pixel, width, height)
      await this._api.tx.substratePixel.mintPixel(pixel, width, height).signAndSend(this._acc, (rs) => {
        console.log(rs)
      })
    }
    // throw new Error('Method not implemented.');
  }

  async mergePixels(pixel: number, width: number, height: number) {
    // throw new Error('Method not implemented.');
    if (this._acc) {
      console.log('merge', pixel, width, height)
      await this._api.tx.substratePixel.mergePixel(pixel, width, height).signAndSend(this._acc, (rs) => {
        console.log(rs)
      })
    }
  }
  pickPixels(pixel: number, width: number, height: number): void {
    throw new Error('Method not implemented.');
  }

}
