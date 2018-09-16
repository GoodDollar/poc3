/* @flow */

import Secrets from '/secrets.json'
import GoodDollar  from '/imports/GoodDollar.js'
const GD =  new GoodDollar(Secrets.ethereum.ropsten.owner.addr,Secrets.ethereum.ropsten.owner.pkey)
export default GD
