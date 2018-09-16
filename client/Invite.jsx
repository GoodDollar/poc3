import React from 'react'
import Web3 from 'web3'
import RaisedButton from 'material-ui/RaisedButton';
import { TextValidator, ValidatorForm } from 'react-material-ui-form-validator';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  Switch
} from 'react-router-dom'


export default class Invite extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      friendEmail:'',
      stake:'',
      trust:''
    }
    this.initListeners()

  }

  //listen to new user event
  initListeners() {

  }
  componentWillUpdate() {
  }
  invite() {
    console.log("submitStakeFriend")
    this.setState({stage:'success'})
    setTimeout(() => this.setState({stage:''}),1500)
  }

  render() {
    if(this.state.stage=='success')
      return <div style={{margin:'auto',fontSize:'24px'}}>Invitation sent</div>
    return (
      <ValidatorForm onSubmit={() => this.invite()}>
        <div>
          <TextValidator
                    hintText="Friend email"
                    onChange={(e,v) => this.setState({friendEmail:v})}
                    name="friendEmail"
                    value={this.state.friendEmail}
                    validators={['required', 'isEmail']}
                    errorMessages={["This field is required","Invalid email format"]}
                />
        </div>
        <div>
          <TextValidator
            hintText="amount of collateral in GoodDollars"
            onChange={(e,v) => this.setState({stake:v})}
            name="stake"
            value={this.state.stake}
            validators={['required', 'matchRegexp:^[0-9]+(\.[0-9]{1,2})?$']}
            errorMessages={["This field is required","Invalid amount"]}
            />
        </div>
        <div>
        <TextValidator
          hintText="Trust Score 0-9"
          onChange={(e,v) => this.setState({trust:v})}
          name="trust"
          value={this.state.trust}
          validators={['required', 'matchRegexp:^[0-9]$']}
          errorMessages={["This field is required","Invalid Trust Score"]}
          />
      </div>
      <div>
        <RaisedButton type="submit" label="Invite Friend" style={{marginTop:'20px'}}/>
      </div>
      </ValidatorForm>
    )
  }


}
