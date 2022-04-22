import jsonrpc from '@polkadot/types/interfaces/jsonrpc'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp'
import { keyring as Keyring } from '@polkadot/ui-keyring'
import { isTestChain } from '@polkadot/util'
import { TypeRegistry } from '@polkadot/types/create'
import { KeyringPair } from '@polkadot/keyring/types'

import { Account, ContractDataService, PickCount, Pixel } from '..'
import { coordinateToIndex, getIndexArray, indexToCoordinate } from '../../lib'

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

const loadAccounts = async (api: ApiPromise, keyringStateUpdate: (state: KeyringState) => void) => {
  try {
    await web3Enable(config.APP_NAME)
    let allAccounts = await web3Accounts()

    allAccounts = allAccounts.map(({ address, meta }) => ({
      address,
      meta: { ...meta, name: `${meta.name} (${meta.source})` },
    }))

    console.log('allAccounts', allAccounts)

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

function rawObjToPixel(obj: {[key: string]: any}): Pixel {
  return {
    pixelId: Number(obj.pixelId.replace(/,/g, '')),
    // width: Number(obj.width),
    // height: Number(obj.height),
    // mergedTo: obj.mergedTo
    owner: obj.owner,
    dateMinted: obj.dateMinted,
  }
}

export class SubstrateDataService implements ContractDataService {
  _api: ApiPromise
  _apiState = ApiState.CONNECT_INIT
  _keyringState = KeyringState.NONE
  // _acc: KeyringPair | null = null

  currentAccount: Account | null = null
  accounts: Account[] = []

  constructor() {
    const provider = new WsProvider(connectedSocket)
    const api = this._api = new ApiPromise({ provider, rpc: jsonrpc })

    // Set listeners for disconnection and reconnection event.
    api.on('connected', () => {
      this._apiState = ApiState.CONNECTING
      // `ready` event is not emitted upon reconnection and is checked explicitly here.
      // api.isReady.then(_api => this._onApiReady())
    })
    api.on('ready', () => this._onApiReady())
    api.on('error', err => this._apiState = ApiState.ERROR)
  }

  private _onApiReady() {
    this._apiState = ApiState.READY
    console.log('_onApiReady')
    // this._api.query.system.events((events: any) => {
    //   console.log(`\nReceived ${events.length} events:`, events);
    //   // Loop through the Vec<EventRecord>
    //   events.forEach((record: any) => {
    //     // Extract the phase, event and the event types
    //     const { event, phase } = record;
    //     const types = event.typeDef;

    //     // Show what we are busy with
    //     console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
    //     console.log(`\t\t${event.meta.toString()}`);

    //     // Loop through each of the parameters, displaying the type and data
    //     event.data.forEach((data: any, index: any) => {
    //       console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
    //     });
    //   });
    // })
  }

  async signIn(): Promise<void> {
    // load accounts
    if (this._keyringState === KeyringState.NONE) {
      await this._api.isReady
      this._keyringState = KeyringState.LOADING
      console.log('loadAccounts')
      await loadAccounts(this._api, (state) => this._keyringState = state)
    }
    const accs = Keyring.getPairs()
    this.accounts = accs.map(pair => ({
      addr: pair.address,
      name: pair.meta.name as string
    }))

    console.log(this.accounts)

    this.setCurrentAccount(this.accounts[0])
  }

  signOut(): void {
    this.currentAccount = null
  }

  getCurrentAccount(): Account | null {
    return this.currentAccount
  }

  setCurrentAccount(account: Account) {
    this.currentAccount = account
  }

  getAccounts(): Account[] {
    return this.accounts
  }

  async getBalance(account: string): Promise<string> {
    const raw = await this._api.query.system.account(account)
    const { data } = raw.toHuman() as any
    console.log(data)
    return data.free
  }

  async getPixels(): Promise<Pixel[]> {
    await this._api.isReady
    const entries = await this._api.query.pixelModule.pixels.entries()
    const pixels = entries.map(([{ args }, value]) => {
      const raw = value.toHuman() as any
      return rawObjToPixel(raw)
    })

    return pixels
  }

  async getLotteryIndex(): Promise<number> {
    await this._api.isReady
    const raw = await this._api.query.lotteryModule.lotteryIndex()
    const index = raw.toHuman() as number

    return index
  }

  async getLotteryAccount(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getAccountPixel(account: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getPickedPixels(): Promise<PickCount[]> {
    const index = await this.getLotteryIndex()
    const pickData = await this._api.query.lotteryModule.pixelPickCnt.entries(index)
    const picks: PickCount[] = pickData.map(([{ args }, value]) => {
      const [indexRaw, pixelIdRaw] = args

      const pixelId = Number((pixelIdRaw.toHuman() as string).replace(/,/g, ''))
      const count = Number(value.toHuman() as string)

      return {
        pixelId,
        count
      }
    })

    return picks
  }

  async getAccountPickedPixels(account: string): Promise<number[]> {
    const index = await this.getLotteryIndex()
    const raw = await this._api.query.lotteryModule.accountPicks(index, account)
    const pickStrArray = raw.toHuman() as string[]

    const picks = pickStrArray.map(str => Number(str.replace(/,/g, '')))
    console.log(raw.toHuman())

    return picks
  }

  async mintPixels(pixel: number, width: number, height: number) {
    if (this.currentAccount) {
      const pixelIds = getIndexArray(pixel, width, height)
      console.log('mint', pixel, width, height, pixelIds, this.currentAccount)
      const pair = Keyring.getPair(this.currentAccount.addr)

      await this._api.tx.pixelModule.batchMintPixels(pixelIds).signAndSend(pair, (rs) => {
        console.log(rs)
      })
    }
  }

  async mergePixels(pixel: number, width: number, height: number) {
    // throw new Error('Method not implemented.');
    // if (this._acc) {
    //   console.log('merge', pixel, width, height)
    //   await this._api.tx.pixelModule.mergePixel(pixel, width, height).signAndSend(this._acc, (rs) => {
    //     console.log(rs)
    //   })
    // }
  }
  async pickPixels(pixel: number, width: number, height: number) {
    if (this.currentAccount) {
      const pixelIds = getIndexArray(pixel, width, height)
      const pair = Keyring.getPair(this.currentAccount.addr)

      console.log('pick', pixelIds, this.currentAccount)

      await this._api.tx.lotteryModule.pick(pixelIds).signAndSend(pair, (rs) => {
        console.log(rs)
      })
    }
  }

}
