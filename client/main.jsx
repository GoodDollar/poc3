import React from 'react';
import ReactDOM from 'react-dom';
import Login from '/client/Login.jsx'
import FomoTasks from '/client/FomoTasks.jsx'
import Invite from '/client/Invite.jsx'
import SideBar from '/client/SideBar'
import UserBadges from '/client/Badges.jsx'
import * as Colors from 'material-ui/styles/colors';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import TrustNetwork from '/client/TrustNetwork.jsx'
import Payment from '/client/Payment.jsx'
import Exchange from '/client/Exchange.jsx'
import _ from 'lodash'
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  Switch
} from 'react-router-dom'


const Account = () => (
  <div>hello</div>
)
const Layout = (props) => (

  <MuiThemeProvider muiTheme={getMuiTheme(baseTheme,{
    "palette": {
        "primary1Color": Colors.indigo400,
        "accent1Color": Colors.teal600,
        "canvasColor": Colors.blue50,

        "textColor": Colors.indigo500
    }
})}>
	<main style={{display:'flex', flexDirection:'column'}}>
      <div style={{display:'flex'}}>
        <UserBadges/>
      </div>
      <div style={{display:'flex'}}>
        <aside style={{display:'flex'}}>
          <SideBar/>
        </aside>
        <div style={{display:'flex',flexDirection:'column', marginTop: "30px", marginLeft: "30px"}}>
          <Switch>
            <Route path="/exchange" component={Exchange}/>
            <Route path="/payment" component={Payment}/>
            <Route path="/invite" component={Invite}/>
            <Route path="/network" component={TrustNetwork}/>
            <Route path="/" component={FomoTasks}/>
          </Switch>
        </div>
			</div>
	</main>
  </MuiThemeProvider>
)

const CleanLayout = (props) => (
	<main style={{display:'flex', flexDirection:'column'}}>
      <Switch>
        <Route path="/login" component={Login}/>
      </Switch>
	</main>
)

var layoutAssignments = {
  '/login': CleanLayout,
  // '/pricing': FullLayout,
  // '/signup': SimpleLayout,
  // '/login': SimpleLayout
}

var layoutPicker = function(props){
  var LayoutS = layoutAssignments[props.location.pathname];
  if (props.location.pathname!='/login' && !blockstack.isUserSignedIn()) {
    return <Redirect to="/login" />
  }
  return LayoutS ? <LayoutS/> : <Layout/>;
};

class Main extends React.Component {
  render(){
    return (
      <Router>
        <Route path="*" render={layoutPicker}/>
      </Router>
    );
  }
}

// const Routes = () => {
//   return (
//     <Router>
//       <L>
//
//       </Route>
//       <Route>
//         <Switch>
//           <Route path="/x" component={Login}/>
//         </Switch>
//       </Route>
//     </Router>
//   )
//
// }
const App = () => (
  <MuiThemeProvider>
    <Main />
  </MuiThemeProvider>
);

import blockstack from 'blockstack'
import Blockstack from '/imports/Blockstack.js'
import Web3 from 'web3'
import ethUtils from 'ethereumjs-util'
Meteor.startup( async (f) => {
  await Blockstack.init()
    .then(res => {
      const appPrivateKey = res.appPrivateKey
      const privateKey = new Buffer(appPrivateKey, 'hex')
      const address = '0x' + ethUtils.privateToAddress(privateKey).toString('hex')

      console.log("called Blockstack.init",res,Blockstack.hasSocialVerified(),address, ethUtils.privateToAddress(privateKey).toString(),ethUtils.privateToPublic(privateKey).toString())
    })
    .catch((e) => console.log("Not logged in:",e))
  const gdProfile = await Blockstack.getGDProfile()
  console.log({gdProfile})
  ReactDOM.render(
    <App />,
    document.getElementById('app')
  );
} );
