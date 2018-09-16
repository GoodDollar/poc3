import React from 'react'
import Web3 from 'web3'
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import ActionRefresh from 'material-ui/svg-icons/navigation/refresh';
import Paper from 'material-ui/Paper';
import glamorous from 'glamorous'
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator';
import Blockstack from '/imports/Blockstack.js'
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  Switch
} from 'react-router-dom'

let Container = glamorous(Paper)({
  padding:'10px'
})

import TextField from 'material-ui/TextField';
const ValueField = glamorous(TextField) ({
  display:'flow',
})
const FlexDivRow = glamorous.div({
  display:'flex',
  flexDirection:'row',
  justifyContent:'space-between'
})
export default class Payment extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      gdPrice:1
    }

  }
  buy = async () => {
    let [txPromise] = await Blockstack.goodDollar.buy(this.state.buyAmount)
    console.log(txPromise)
    txPromise.on('txhash',console.log)
    txPromise.then(console.log).catch(console.log)
  }
  sell = async () => {
    let [txPromise] = await Blockstack.goodDollar.sell(this.state.sellAmount)
    console.log(txPromise)
    if(txPromise.on != undefined)
      txPromise.on('txhash',console.log)
    txPromise.then(console.log).catch(console.log)
  }
  estimate =(fieldName) => {
    let handler = _.debounce(async (e,v) => {
      if(fieldName=='buy')
      {
        let res = await Blockstack.goodDollar.getBuyPrice(v)
        this.setState({buyAmount:v,'estimatedBuyPrice':res})
      }
      else if(fieldName=='sell')
      {
        let res = await Blockstack.goodDollar.getSellPrice(v)
        this.setState({sellAmount:v,'estimatedSellPrice':res})
      }
    },500)
    return (e,v) => {
      e.persist()
      handler(e,v)
    }
  }
  render() {
    return (
      <div className="row">
          <Container id="buying">
              <div className="container__header">
                  <h2 className="container__header">Buy GTC</h2>
              </div>
              <div className="estimate">
                  <FlexDivRow className="field estimate-input">
                      <p className="label--dark">ETH</p>
                      <ValueField ref={e => this.buyAmount = e} style={{width:'40%'}} id='buy-amount' label="Ether" onChange = {this.estimate('buy')}/>
                      <IconButton className="estimateRefresh"><ActionRefresh/></IconButton>
                      <div className="field estimate-output">
                        <div className="label--dark">Estimated GTC</div>
                        <div className="estimate-amount"><span id="buy_price">{this.state.estimatedBuyPrice}</span></div>
                      </div>
                  </FlexDivRow>
              </div>
              <FlexDivRow className="container__cta">
                  <RaisedButton onClick={this.buy} style={{marginLeft:'auto'}}>Buy</RaisedButton>
              </FlexDivRow>

          </Container>
          <Container id="selling">
              <div className="container__header">
                  <h2>Sell GTC</h2>
              </div>
              <div className="estimate">
                <FlexDivRow className="field estimate-input">
                    <p className="label--dark">GTC</p>
                    <ValueField ref={e => this.sellAmount = e} style={{width:'40%'}} id='sell-amount' label="GTC" onChange = {this.estimate('sell')}/>
                    <IconButton className="estimateRefresh"><ActionRefresh/></IconButton>
                    <div className="field estimate-output">
                      <div className="label--dark">Estimated ETH</div>
                      <div className="estimate-amount"><span id="sell_price">{this.state.estimatedSellPrice}</span></div>
                    </div>
                </FlexDivRow>
              </div>
              <FlexDivRow className="container__cta">
                  <RaisedButton onClick={this.sell} style={{marginLeft:'auto'}}>Sell</RaisedButton>
              </FlexDivRow>
          </Container>
      </div>

    )
  }

}
