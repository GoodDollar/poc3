//@flow
import blockstack from 'blockstack'
import _ from 'lodash'
import ethUtils from 'ethereumjs-util'
import {sign,verifySignature} from '/imports/web3utils.js'
import GoodDollar from '/imports/GoodDollar.js'
const Events = {
  CREATE_ACCOUNT_FAILED:"Account Creation Failed"
}
const Attestations = {
  ACCOUNT_CREATED: "Account Created"
}

export type Attestation = $Values<typeof Attestations>;
export type Event = $Values<typeof Events>;
export type UserData = {
  appPrivateKey:string,
  username:string,
  profile:any,
  authResponseToken:string,
  identityAddress:string,
  decentralizedID:string
}

export type Entity = {
  "@did":string,
  publicKey:string,
}
export type Claim = {
  issuer: Entity,
  subject: Entity,
  sig?:string,
  claim: any,
  issuedAt: Date,
  expiresAt?: Date,
}

export type GDProfile = {
  address: string,
  attestations: Array<Claim>
}
export class Blockstack {
  userData:UserData
  profile:GDProfile
  goodDollar:GoodDollar
  static Events = Events
  static Attestations = Attestations
  constructor() {
    //$FlowFixMe
    this.userData = {}
    this.validIdentityServices = ['twitter','facebook']
  }
  initFakeWindow() {
    const localStorageRAM = {};

    global.window = {
      location: {
        origin: 'localhost',
        search: ""
      },
      localStorage: {
        getItem: function(itemName) {

          let res = localStorageRAM[itemName] || null;
          console.log({itemName,res})
          return res
        },
        setItem: function(itemName, itemValue) {
          console.log({itemName,itemValue})
          localStorageRAM[itemName] = itemValue;
        },
        removeItem: function(itemName) {
          delete localStorageRAM[itemName];
        }
      }
    }
    global.location = global.window.location
    global.localStorage = global.window.localStorage
  }
  /**
   * [setUserData for server side, we overwrite the default loadUserData which reads from localStorage]
   * @param {[UserData]} ud [the user data as returned from blockstack login]
   */
  async setUserData(ud:UserData) {
    this.initFakeWindow()
    localStorage.setItem('blockstack',JSON.stringify(ud))
    Object.defineProperties(blockstack, {loadUserData:() => ud})
    this.userData = ud
    global.window.location.search = `?authResponse=${ud.authResponseToken}`
    // await blockstack.getOrSetLocalGaiaHubConnection()


  }
  async getGDProfile(username?:string) {
    if(!this.profile && this.isLoggedIn())
      this.profile = await blockstack.getFile("profile.js",{username,app:Meteor.absoluteUrl("/"),decrypt:false}).then(file => file? JSON.parse(file):{}).catch(e => {return {}})
    return this.profile || {}
  }
  getUserEthAddr() {
    const appPrivateKey = this.userData.appPrivateKey
    const privateKey = new Buffer(appPrivateKey, 'hex')
    const address = '0x' + ethUtils.privateToAddress(privateKey).toString('hex')
    return address
  }
  init() {
    let loginPromise
    if(blockstack.isUserSignedIn()) loginPromise = Promise.resolve({})
    else if(blockstack.isSignInPending()) {
        loginPromise = blockstack.handlePendingSignIn()
    } else return Promise.resolve({})
    return loginPromise.then(async () => {
      this.userData = blockstack.loadUserData()
      let gdProfile = await this.getGDProfile()
      if(_.get(gdProfile,'address')==undefined)
      {
        gdProfile.address = this.getUserEthAddr()
        let res = await blockstack.putFile("profile.js",JSON.stringify(gdProfile),{encrypt:false})
      }
      this.goodDollar = new GoodDollar(this.getUserEthAddr(),'0x'+this.userData.appPrivateKey)
      return this.userData
    })

  }
  isLoggedIn() {
    return blockstack.isUserSignedIn()
  }
  //check if attestation type by verifier with publickey exists
  async hasGDAttestation(att:Attestation) {
    let profile = await this.getGDProfile()
    console.log("hasGDAttestation",profile)
    return _.find(_.get(profile,'attestations',[]),(claim:Claim) => {
        let sig = claim.sig || ""
        //omit the sig field which isnt part of the original claim hash
        return claim.claim[att] && verifySignature(_.omit(claim,'sig'),sig,claim.issuer.publicKey)
    })

  }
  async addGDEvent(e:Event,data:any) {
  }

  async addGDAttestation(att:Attestation,data:any,verifier:Entity,verifierKey:string) {
    try {
      let profile = await this.getGDProfile()
      let attestations = _.get(profile,'attestations',[])
      let attestation:Claim = {
        issuer: verifier,
        subject: {
          "@did": this.userData.decentralizedID,
          publicKey: this.userData.identityAddress
        },
        claim: {[att]:data},
        issuedAt: new Date(),
      }
      let sig = sign(attestation,verifierKey)
      attestation.sig = sig
      attestations.push(attestation)
      profile.attestations = attestations
      console.log('addGDAttestation new',{profile})
      let res = await blockstack.putFile("profile.js",JSON.stringify(profile),{encrypt:false})
      console.log('addGDAttestation',{res})

    } catch (e) {
        console.log(e)
    } finally {

    }
  }
  async reloadProfile() {
    let profile = await blockstack.lookupProfile(this.userData.username)
    this.userData.profile = profile
    if(window.localStorage)
      window.localStorage.setItem('blockstack',JSON.stringify(this.userData))
  }

  getProfile() {
    return _.get(this.userData,'profile')
  }

/*
Optimistic
*/
  hasSocialVerified() {
    let found = _.find(_.get(this.userData,'profile.account'),(o) => _.includes(this.validIdentityServices,o.service))
    return found!=null
  }
  /*
    perform actuall checks
  */
  async isSocialVerified() {
    let proofs = await blockstack.validateProofs(this.getProfile(),this.userData.identityAddress)
    console.log("isSocialVerified",proofs)
    return _.find(proofs,(o) => o.valid==true && _.includes(this.validIdentityServices,o.service))!=null
  }

  /*
  Optimistic
  */
    hasHumanProofs() {
      let found = this.hasSocialVerified()
      return found!=null
    }
    /*
      perform actuall checks
    */
    async isHumanVerified() {
      let socialVerified = await this.isSocialVerified()
      console.log("isHumanVerified",socialVerified)
      return socialVerified

    }

}
Blockstack.Events = Events
Blockstack.Attestations = Attestations
export default new Blockstack()
