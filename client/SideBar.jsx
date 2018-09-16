import React from 'react';
import Paper from 'material-ui/Paper';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import PayIcon from 'material-ui/svg-icons/action/payment';
import PersonAdd from 'material-ui/svg-icons/social/person-add';
import GroupIcon from 'material-ui/svg-icons/social/group';
import ContentLink from 'material-ui/svg-icons/content/link';
import Divider from 'material-ui/Divider';
import ContentCopy from 'material-ui/svg-icons/content/content-copy';
import Download from 'material-ui/svg-icons/file/file-download';
import Delete from 'material-ui/svg-icons/action/delete';
import FontIcon from 'material-ui/FontIcon';
import { withRouter } from "react-router-dom";

const style = {
  paper: {
    margin: '16px 32px 16px 0',
  },
  rightIcon: {
    textAlign: 'center',
    lineHeight: '24px',
  },
};

const SideBar = (props) => (
  <div>
    <Paper style={style.paper}>
      <Menu>
        <MenuItem id='exchange' primaryText="Buy/Sell GoodDollar" leftIcon={<PayIcon />}  onClick={() => props.history.push('/exchange')}/>
        <MenuItem id='pay' primaryText="Pay with GoodDollar" leftIcon={<PayIcon />}  onClick={() => props.history.push('/payment')}/>
        <MenuItem id='invite' primaryText="Trust Connect" leftIcon={<PersonAdd />} onClick={() => props.history.push('/invite')}/>
        <MenuItem primaryText="Trust Network" leftIcon={<GroupIcon />} onClick={() => props.history.push('/network')}/>
      </Menu>
    </Paper>
  </div>
);

export default withRouter(SideBar);
