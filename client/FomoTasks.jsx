import React from 'react';
import {List, ListItem} from 'material-ui/List';
import ActionGrade from 'material-ui/svg-icons/action/grade';
import ActionDone from 'material-ui/svg-icons/action/done';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import Avatar from 'material-ui/Avatar';
import {pinkA200,yellowA200, transparent} from 'material-ui/styles/colors';
import {Card} from 'material-ui/Card';




export default class FomoTasks extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <Card style={{backgroundColor:'none'}}>
     <List>
     <Subheader style={{fontSize:'20px'}}>Complete To Start Claiming G$s!<br/>You have 100G$ waiting!</Subheader>
       <VerifyHumanProofs/>
       <ListItem
         primaryText="Invite 3 Friends"
         insetChildren={true}
         rightIcon={<ActionGrade color={yellowA200} />}
         leftAvatar={<Avatar backgroundColor={transparent}><ActionDone/></Avatar>}
       />
       <ListItem
         primaryText="Verify 3 Profiles"
         insetChildren={true}
         rightIcon={<ActionGrade color={yellowA200} />}
         leftAvatar={<Avatar backgroundColor={transparent}><ActionDone/></Avatar>}
       />
     </List>
     <Divider inset={true} />
     <List>
       <Subheader style={{fontSize:'20px'}}>Complete To Earn Bonus G$s!</Subheader>
       <ListItem
         primaryText="Verify 3 Social Accounts"
         leftAvatar={
           <Avatar
             color={yellowA200} backgroundColor={transparent}
             style={{left: 8}}
           >
           <ActionGrade color={yellowA200}/>
           <ActionGrade color={yellowA200}/>
           </Avatar>
         }
         rightAvatar={<Avatar><ActionDone/></Avatar>}
       />
       <ListItem
         primaryText="Verify Mobile"
         insetChildren={true}
         rightAvatar={<Avatar><ActionDone/></Avatar>}
       />
       <ListItem
         primaryText="Verify Location"
         insetChildren={true}
         rightAvatar={<Avatar><ActionDone/></Avatar>}
       />
       <ListItem
         primaryText="Get Verified By 5 Citizens"
         insetChildren={true}
         rightAvatar={<Avatar><ActionDone/></Avatar>}
       />
       <ListItem
         primaryText="Connect With 10 Friends"
         insetChildren={true}
         rightAvatar={<Avatar><ActionDone/></Avatar>}
       />
     </List>
     </Card>
   )
  }
}

import CircularProgress from 'material-ui/CircularProgress';
import CircleCheck from 'material-ui/svg-icons/action/check-circle';
import CircleClear from 'material-ui/svg-icons/content/remove-circle';
import blockstack from 'blockstack'
import Blockstack from '/imports/Blockstack.js'
import _ from 'lodash'
export class VerifyHumanProofs extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      verified:Blockstack.hasSocialVerified()
    }
  }
  componentDidMount() {

  }
  componentWillUnmount() {
    clearInterval(this.interval)
  }
  openVerifyPopup() {
    if(Blockstack.hasSocialVerified())
      return
    this.setState({closed:false})
    let w = window.screen.width>800? 800: window.screen.width
    let h = window.screen.height>1200?1200 : window.screen.height
    let top = window.screen.height - h;
    top = top > 0 ? top/2 : 0;

    let left = window.screen.width - w;
    left = left > 0 ? left/2 : 0;

    this.profileWindow = window.open('https://browser.blockstack.org/profiles',"blockstack",`'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=${w},height=${h},left=${left},top=${top}`)
    this.profileWindow.focus()
    this.profileWindow.onClose = function() { console.log("closed")}
    this.interval = setInterval(() => {
      if(this.profileWindow.closed) { // After getting verification from block stack, goodDollar re-check by itself that the user has fulfilled blockstack terms.
        this.recheck() // Public proof
        clearInterval(this.interval)
      }

    },1000)
  }
  async recheck() {
    console.log("reloading profile")
    await Blockstack.reloadProfile()
    Meteor.call('verifySocial',Blockstack.userData,(err,res) => {
      console.log("verifySocial cb",err,res)
      if(!err && _.get(res,'verified',false))
        this.recheckHumanProofs()
      else this.setState({closed:true,verified:false})
    })

    console.log("profile reloaded, updating server.")
    //Meteor.call('verifySocial',Blockstack.userData)



  }
  recheckHumanProofs() {
    if(Blockstack.hasHumanProofs()) {
      Meteor.call('verifyHumanProofsAndWhitelist',Blockstack.userData,(err,res) => {
        console.log("verifyHumanProofs cb",err,res)
        if(!err && !_.get(res,'error',null))  this.setState({closed:true,verified:true})
        else this.setState({closed:true,verified:false})
      })
    } else this.setState({closed:true,verified:false})
  }
  render() {
    // if(!Blockstack.isLoggedIn())
    //   return <Redirect to="/login"/>
    // if(Blockstack.hasSocialVerified()=='x') return null
    let buttonIcon = null
    if(_.get(this.state,'closed')==false)
      buttonIcon = <CircularProgress size={20}/>
    if( _.get(this.state,'verified')==true)
      buttonIcon = <CircleCheck/>
    if( _.get(this.state,'verified')==false)
      buttonIcon = <CircleClear color="red"/>

    return (
      <ListItem
        onClick={() => this.openVerifyPopup()}
        primaryText="Verify a social account"
        rightIcon={<span style={{width:'auto'}}> <ActionGrade color={ _.get(this.state,'verified')?'yellow':'grey'} /><span style={{position:'relative',bottom:5}}>5 G$</span></span>}
        leftAvatar={<Avatar backgroundColor={transparent}>{buttonIcon}</Avatar>}
      />
      // <div>
      //   <FomoTasks/>
      //   <div>You need to verify at least one social profiles</div>
      //   <div><RaisedButton type="submit" icon={buttonIcon} labelPosition="before" label="Verify Social Accounts" onClick={() => this.openVerifyPopup()}/></div>
      //   <div>Close the popup once you have verified an account</div>
      // </div>
    )
  }
}
