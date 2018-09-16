/* @flow */

// $FlowFixMe
import blockstack from 'blockstack'
import Blockstack,{Blockstack as BS} from '/imports/Blockstack.js'
import GoodDollarAdmin from '/imports/server/GoodDollarAdmin.js'
import Web3PromieEvent from 'web3-core-promievent'
import {promisifyTxHash} from '/imports/web3utils.js'
import  GoodDollar  from '/imports/GoodDollar.js'


type TxHash = string
type OpenAccountResult = {
  exists:boolean,
  txHash?:string,
  error?:string
}


const openGDAccount = async (user:typeof Blockstack):Promise<OpenAccountResult> => {
  if(!Blockstack.hasGDAttestation(BS.Attestations.ACCOUNT_CREATED))
  {
      let [tx:Web3PromieEvent,txHashPromise:Promise<string>] = await GoodDollarAdmin.createAccount(Blockstack.getUserEthAddr(),Blockstack.userData.decentralizedID)
      console.log("openGDAccount",tx,await txHashPromise)
      tx.then(res => {
        Blockstack.addGDAttestation(BS.Attestations.ACCOUNT_CREATED,{},{"@did":"did:gooddollar.id",publicKey:GoodDollarAdmin.publicKey.toString("hex")},GoodDollarAdmin.pkey)
      }).catch(e => {
        Blockstack.addGDEvent(BS.Events.CREATE_ACCOUNT_FAILED,e.message)
      })
      return txHashPromise.then((txHash) => { return {exists:false,txHash}})
      // return promisifyTxHash(tx)
  }
  return Promise.resolve({exists:true})
}
//$FlowFixMe
Meteor.methods({
  async 'verifySocial'(userData) {
      await Blockstack.setUserData(userData)
      console.log("verifySocial",userData.profile)
      let res = await Blockstack.isSocialVerified()
      return {verified:res}
  },
  async 'verifyHumanProofsAndWhitelist'(userData) {
    await Blockstack.setUserData(userData)
    console.log("verifyHumanProofsAndWhitelist",userData.profile)
    let res = await Blockstack.isHumanVerified()
    if(res)
      return openGDAccount(Blockstack)
    else return {error:'Unable to verify human proofs'}

  }
})
