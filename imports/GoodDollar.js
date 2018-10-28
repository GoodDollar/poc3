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
import GoodDollarUtils from '/imports/GoodDollarUtils.js'
import ethUtils from 'ethereumjs-util'

export default class GoodDollar {

  web3:Web3;
  accountsContract:Web3.eth.Contract
  tokenContract:Web3.eth.Contract
  gasPrice:Promise<number>
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
    this.accountsContract = new this.web3.eth.Contract(RedemptionContract.abi,RedemptionContract.networks[this.netword_id].address,{from:addr})
    this.tokenContract = new this.web3.eth.Contract(GoodDollarContract.abi,GoodDollarContract.networks[this.netword_id].address,{from:addr})
    this.marketContract = new this.web3.eth.Contract(MarketContract.abi,MarketContract.networks[this.netword_id].address,{from:addr})
    this.gasPrice = this.web3.eth.getGasPrice()
    this.tokenDecimals = 4 // default. will be overriden by the coin contract
    this.goodDollarUtils = undefined // will be set once the token decimals are initialized
   
    
    this.goodDollarUtils = new GoodDollarUtils(this.web3, this.marketContract, this.tokenDecimals) // will be override when token decimals are returned from the contract
    this.tokenContract.methods.decimals().call().then(((res,err)=>{
      if (!err){
        this.tokenDecimals = res;
        this.goodDollarUtils = new GoodDollarUtils(this.web3, this.marketContract, this.tokenDecimals)  
      }else{
        console.error(err);
        console.warning("# of decimals failed to load from GoodDollar contract, using default number:"+this.tokenDecimals);
      }
      
      
    }).bind(this))
    
  }


  balanceChanged(callback:(error,event) => any) {
    let handler = this.tokenContract.events.Transfer({fromBlock:'latest',filter:{'from':this.addr}},callback)
    let handler2 = this.tokenContract.events.Transfer({fromBlock:'latest',filter:{'to':this.addr}},callback)
    let burnHandler = this.tokenContract.events.Burn({fromBlock:'latest',filter:{'burner':this.addr}},callback)
    let mintHandler = this.tokenContract.events.Mint({fromBlock:'latest',filter:{'to':this.addr}},callback)
    return [handler,handler2,burnHandler,mintHandler]
  }

  ethBalanceOf():Promise<Number> {
    let web3 = this.web3
    let addr = this.addr
    return new Promise(function (resolve, reject) {
      web3.eth.getBalance(addr).then(

        function (res) {
          resolve(web3.utils.fromWei(res, 'ether'));

        });
    }).catch(console.log)
  }


  balanceOf():Promise<Number> {
    return this.tokenContract.methods.balanceOf(this.addr).call({'from': this.addr}).then(b => {
      b = this.goodDollarUtils.fromGDUnits(b, '0');
      return b
    })
  }
  async buy(ethAmount):Promise<[typeof Web3PromieEvent]> {
    try
    {
      let amount = this.web3.utils.toWei(ethAmount, "ether");
      let gasUnits = (await this.marketContract.methods.buy().estimateGas({value:amount}))
      gasUnits = gasUnits * 2
      let gasPrice = await this.gasPrice
      console.log({gasUnits,gasPrice,amount})
      let txPromise:Web3PromieEvent = this.marketContract.methods.buy().send({
       
        gasPrice:gasPrice,
        gas:gasUnits,
        value: amount
      })
      return [txPromise]
    }
    catch(e) {
      console.error(e)
      return [Promise.reject(e)]
    }
  }

  async sell(gdAmount):Promise<[typeof Web3PromieEvent]> {
    let amount = this.goodDollarUtils.toGDUnits(gdAmount, '0');
    try
    {
      let gasUnits = await this.marketContract.methods.sell(amount).estimateGas()
      gasUnits = gasUnits * 2
      let gasPrice = await this.gasPrice
      console.log({gasUnits,gasPrice,amount})
      let txPromise:Web3PromieEvent = this.marketContract.methods.sell(amount).send({
        gasPrice:gasPrice,
        gas:gasUnits
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
    let amount = this.goodDollarUtils.toGDUnits(gdAmount, '0');
    console.log(`amount: ${amount}`);
    return this.marketContract.methods.calculatePriceForSale(amount).call().then(b => {
      b = this.web3.utils.fromWei(b, 'ether')
      return b
    })
  }
  checkEntitlement():Promise<Number> {
    console.log("this.addr="+this.addr);
    return this.accountsContract.methods.checkEntitlement().call({ 'from': this.addr }).then(b => {
      console.log("checkEntitlement(), response="+b);
      b = this.web3.utils.fromWei(b, 'ether')
      return b
    })
  }

  checkWhiteListStatus():Promise<Boolean> { 
      console.log("this.addr="+this.addr);
      return this.accountsContract.methods.checkWhiteListStatus().call().then(b => {
        console.log("checkWhiteListStatus(), response="+b);
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
