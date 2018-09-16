/* @flow */

// $FlowFixMe
import blockstack from 'blockstack'
// $FlowFixMe
import _ from 'lodash'
// $FlowFixMe
import RedemptionContract from '/imports/contracts/RedemptionFunctional.json'
import GoodDollarContract from '/imports/contracts/GoodCoin.json'
import MarketContract from '/imports/contracts/GoodCoinMarket.json'
// $FlowFixMe
import Web3 from 'web3'
// $FlowFixMe
import Web3PromieEvent from 'web3-core-promievent'
import WebsocketProvider from 'web3-providers-ws'
import {promisifyTxHash} from '/imports/web3utils.js'
import ethUtils from 'ethereumjs-util'

export default class GoodDollar {

  web3:Web3;
  accountsContract:Web3.eth.Contract
  tokenContract:Web3.eth.Contract
  gasPrice:number
  pkey:string
  addr:string
  publicKey:Buffer


  constructor(addr:string,pkey:string) {
    // $FlowFixMe
    this.addr = addr
    this.pkey = pkey
    this.publicKey = ethUtils.privateToPublic(ethUtils.toBuffer(pkey))
    this.web3 = new Web3(new WebsocketProvider(Meteor.settings.public.infurawss));
    this.web3.eth.accounts.wallet.add(pkey)
    this.web3.eth.defaultAccount = addr
    this.accountsContract = new this.web3.eth.Contract(RedemptionContract.abi,'0xef672c34abc762590f18e6f9fb26739acf0f9da5',{from:addr})
    this.tokenContract = new this.web3.eth.Contract(GoodDollarContract.abi,'0x495bf815fd7b065d8ab491ff4cc18b9bb472e04a',{from:addr})
    this.marketContract = new this.web3.eth.Contract(MarketContract.abi,'0x27cc97cc4a32d6dd6c62864c0956a3d2f1144d53',{from:addr})
    this.gasPrice = this.web3.eth.getGasPrice()
  }

  balanceChanged(callback:(error,event) => any) {
    let handler = this.tokenContract.events.Transfer({fromBlock:'latest',filter:{'from':this.addr}},callback)
    let handler2 = this.tokenContract.events.Transfer({fromBlock:'latest',filter:{'to':this.addr}},callback)
    return [handler,handler2]
  }
  balanceOf():Promise<Number> {
    return this.tokenContract.methods.balanceOf(this.addr).call().then(b => {
      b = this.web3.utils.fromWei(b, 'ether')
      return b
    })
  }
  async buy(ethAmount):Promise<[typeof Web3PromieEvent]> {
    let amount = this.web3.utils.toWei(ethAmount, "ether");
    try
    {
      let gas = (await this.marketContract.methods.buy().estimateGas({value:amount}))
      let gasPrice = (await this.gasPrice)*2
      console.log({gas,gasPrice,amount})
      let txPromise:Web3PromieEvent = this.marketContract.methods.buy().send({
        gasPrice,
        gas,
        value: amount
      })
      return [txPromise]
    }
    catch(e) {
      return [Promise.reject(e)]
    }
  }

  async sell(gdAmount):Promise<[typeof Web3PromieEvent]> {
    let amount = this.web3.utils.toWei(gdAmount, "ether");
    try
    {
      let gas = await this.marketContract.methods.sell(amount).estimateGas()
      let gasPrice = (await this.gasPrice)*2
      console.log({gas,gasPrice,amount})
      let txPromise:Web3PromieEvent = this.marketContract.methods.sell(amount).send({
        gasPrice,
        gas
      })
      return [txPromise]
    }
    catch(e) {
      return [Promise.reject(e)]
    }
  }
  getBuyPrice(ethAmount:Number):Promise<Number> {
    let amount = this.web3.utils.toWei(ethAmount, "ether");
    console.log(`amount: ${amount}`);
    return this.marketContract.methods.calculateAmountPurchased(amount).call().then(b => {
      b = this.web3.utils.fromWei(b, 'ether')
      return b
    })
  }
  getSellPrice(gdAmount:Number):Promise<Number> {
    let amount = this.web3.utils.toWei(gdAmount, "ether");
    console.log(`amount: ${amount}`);
    return this.marketContract.methods.calculatePriceForSale(amount).call().then(b => {
      b = this.web3.utils.fromWei(b, 'ether')
      return b
    })
  }
  checkEntitlement():Promise<Number> {
    return this.accountsContract.methods.checkEntitlement().call().then(b => {
      b = this.web3.utils.fromWei(b, 'ether')
      return b
    })
  }

  async claim():Promise<[typeof Web3PromieEvent]> {
    try
    {
      let txPromise:Web3PromieEvent = this.accountsContract.methods.claimTokens().send({
        gasPrice:await this.gasPrice,
        gas: await this.accountsContract.methods.claimTokens().estimateGas()
      })
      return [txPromise]
    }
    catch(e) {
      return [Promise.reject(e)]
    }
  }


  /**
   * [createAccount description]
   * @param  {[string]} ethAddr          [the public ether wallet address of the user]
   * @param  {[string]} verifiedIdentity [a uri for the user identity such as blockstack decentralizedid "did:btc-addr:15BpboXSK9hn5LnhUodbvZxax74E1q7iic"]
   * @return {[Web3PromieEvent]}                  [description]
   */
  async createAccount(ethAddr:string,verifiedIdentity:string):Promise<[typeof Web3PromieEvent,$Call<typeof promisifyTxHash>]> {
      let txPromise:Web3PromieEvent = this.accountsContract.methods.whiteListUser(ethAddr).send({
        gasPrice:await this.gasPrice,
        gas: await this.accountsContract.methods.whiteListUser(ethAddr).estimateGas()
      })
      return [txPromise,promisifyTxHash(txPromise)]

  }
}
