import React from 'react'
import Badge from 'material-ui/Badge';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import Web3PromieEvent from 'web3-core-promievent'


export default class TxButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      created:false,
      error:null,
      txHash:null,
      executed:false
    }
  }

  async onClick() {
    let tx:Web3Web3PromieEvent = (await this.props.onClick())[0]
    if(tx.on != undefined)
      tx.on("transactionHash",(txHash) => this.setState({txHash,created:true,error:null,executed:false}))
    tx.then(tx => {
      this.setState({tx,executed:true,created:false})
      setTimeout(() => this.setState({executed:false,created:false}),3000)
    }).catch(e => this.setState({created:false,executed:false,error:e}))
  }

  render() {
    let children = this.props.children
    if(this.state.created)
      children = <div>...</div>
    else if(this.state.executed)
      children = <div>Done</div>
    else if(this.state.error)
      children = <div>!</div>

    return (
      <RaisedButton onClick={() => this.onClick()} >{children}</RaisedButton>
    )
  }
}
