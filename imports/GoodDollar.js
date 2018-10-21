/* @flow */

// $FlowFixMe
import blockstack from 'blockstack'
// $FlowFixMe
import _ from 'lodash'
// $FlowFixMe
import RedemptionContract from '/imports/contracts/RedemptionFunctional.json'
import GoodDollarContract from '/imports/contracts/GoodCoin.json'
import MarketContract from '/imports/contracts/GoodCoinMarket.json'
import abi from '/imports/abi.js'

// $FlowFixMe
import Web3 from 'web3'
// $FlowFixMe
import Web3PromieEvent from 'web3-core-promievent'
import WebsocketProvider from 'web3-providers-ws'
import {promisifyTxHash} from '/imports/web3utils.js'
import GoodDollarUtils from '/imports/GoodDollarUtils.js'
import ethUtils from 'ethereumjs-util'

export default class GoodDollar {

  web3:Web3;
  accountsContract:Web3.eth.Contract
  tokenContract:Web3.eth.Contract
  gasPrice:number
  pkey:string
  addr:string
  publicKey:Buffer
  netword_id:number


  // adrress: The address that deployed the GoodDollar contract
  // pKey: privateKey of account owner of the address above
  constructor(addr:string,pkey:string) {
    // $FlowFixMe
    this.addr = addr
    this.pkey = pkey
    this.publicKey = ethUtils.privateToPublic(ethUtils.toBuffer(pkey))
    this.web3 = new Web3(new WebsocketProvider(Meteor.settings.public.web3provider)) // can be - "wss://ropsten.infura.io/ws" or "ws://localhost:8545" or any other.
        
    this.web3.eth.accounts.wallet.add(pkey)
    this.web3.eth.defaultAccount = addr
    this.netword_id = Meteor.settings.public.network_id 
    this.accountsContract = new this.web3.eth.Contract(abi,RedemptionContract.networks[this.netword_id],{from:addr})
    this.tokenContract = new this.web3.eth.Contract(abi,GoodDollarContract.networks[this.netword_id],{from:addr})
    this.marketContract = new this.web3.eth.Contract(abi,MarketContract.networks[this.netword_id],{from:addr})
    this.gasPrice = this.web3.eth.getGasPrice()
    this.tokenDecimals = 4 // default. will be overriden by the coin contract
    this.goodDollarUtils = undefined // will be set once the token decimals are initialized
    
    console.log("debug")
    //console.log(this.web3.version.network)
    this.web3.eth.net.getId().then(console.log)

    

    this.tokenContract.methods.decimals().call().then(((err,res)=>{
      this.tokenDecimals = res;
      this.goodDollarUtils = new GoodDollarUtils(this.web3, this.marketContract, this.tokenDecimals)  
    }).bind(this))

    this.goodDollarUtils = new GoodDollarUtils(this.web3, this.marketContract, this.tokenDecimals)  

    
  }

  

  balanceChanged(callback:(error,event) => any) {
    let handler = this.tokenContract.events.Transfer({fromBlock:'latest',filter:{'from':this.addr}},callback)
    let handler2 = this.tokenContract.events.Transfer({fromBlock:'latest',filter:{'to':this.addr}},callback)
    return [handler,handler2]
  }
  balanceOf():Promise<Number> {
    return this.tokenContract.methods.balanceOf(this.addr).call().then(b => {
      b = goodDollarUtils.fromGDUnits(b, '0');
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
    amount = this.GoodDollarUtils.toGDUnits(amount, '0');
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
      b = this.goodDollarUtils.fromGDUnits(b, '0');
      return b
    })
  }
  getSellPrice(gdAmount:Number):Promise<Number> {
    amount = this.GoodDollarUtils.toGDUnits(amount, '0');
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

  /*
      unitMap = {
        '0': '1',
        '1': '10',
        '2': '100',
        '3': '1000',
        '4': '10000', // used for all base calculations, like wei
      };
      */
    
      // Should be part of "GDjs.js" - a utilty class for GoodDollar token.
      toGDUnits(gdTokens, inWhichPrecision) {
    
        // Assumption: gdTokens are provided on the smallest presicion unit base (see map)
    
        let precision = parseInt(inWhichPrecision);
        if ((precision != undefined) && (!isNaN(precision))) {
    
          let power = this.tokenDecimals - precision;
          var convertedTokens = gdTokens * (10 ** power)
          return convertedTokens;
        } else {
          return NaN;
        }
      }
    
        // Should be part of "GDjs.js" - a utilty class for GoodDollar token.
    
      fromGDUnits(gdTokens, toWhichPrecision) {
    
        // Assumption: gdTokens are provided on the smallest presicion unit base (see map)
    
        let precision = parseInt(toWhichPrecision);
        if ((precision != undefined) && (!isNaN(precision))) {
    
          let power = this.tokenDecimals - precision;
          let negativePower = power * -1;
          var convertedTokens = gdTokens * (10 ** negativePower)
          return convertedTokens;
        } else {
          return NaN;
        }
      }
}
