import { useEffect } from 'react'

import { ContractPlatform, getContractDataService } from '../../services'
import { useContractDataService } from '../hooks'

export const MainLand: React.FC<{}> = () => {
  // const service = useContractDataService()

  // useEffect(() => {
  //   (async () => {
  //     if (service) {
  //       service.getPixels()
  //       console.log(service.getAuthorizedAccountId())
  //     }
  //   })()
  // }, [service])

  // const signIn = async () => {
  //   if (service) {
  //     service.signIn()
  //   }
  // }

  // const signOut = async () => {
  //   if (service) {
  //     service.signOut()
  //   }
  // }

  return (
    <>
      <div>MainLand</div>
      {/* <button onClick={signIn}>Login</button>
      <button onClick={signOut}>Logout</button> */}
    </>
  )
}