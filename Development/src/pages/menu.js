import React from 'react';
import { NavLink } from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import BuildIcon from '@material-ui/icons/Build';
import CallMadeIcon from '@material-ui/icons/CallMade';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import SettingsCellIcon from '@material-ui/icons/SettingsCell';
import SettingsInputAntennaIcon from '@material-ui/icons/SettingsInputAntenna';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import DvrIcon from '@material-ui/icons/Dvr';
import SettingsIcon from '@material-ui/icons/Settings';
import QueryIcon from '@material-ui/icons/HelpOutline';
import { MenuItem, MenuList, Paper } from '@material-ui/core';

const styles = theme => ({
    root: {
        width: '100%',
        maxWidth: 360,
    },
});

const settingStyle = {
    padding: '16px',
};

class NestedList extends React.Component {
    state = {
        open: false,
    };
    handleClick = () => {
        this.setState(state => ({ open: !state.open }));
    };

    render() {
        const { classes } = this.props;

        return (
            <div className={classes.root}>
                <MenuList>
                    <ListItem
                        disableGutters={true}
                        style={settingStyle}
                        button
                        onClick={this.handleClick}
                    >
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                        {this.state.open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Paper>
                        <Collapse
                            in={this.state.open}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div">
                                <MenuItem component={NavLink} to={'/settings'}>
                                    <ListItemIcon>
                                        <BuildIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="General" />
                                </MenuItem>
                                <MenuItem component={NavLink} to={'/queryapis'}>
                                    <ListItemIcon>
                                        <QueryIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Query APIs" />
                                </MenuItem>
                            </List>
                        </Collapse>
                    </Paper>
                    <div />
                    <MenuItem component={NavLink} to={'/nodes'}>
                        <ListItemIcon>
                            <DvrIcon />
                        </ListItemIcon>
                        <ListItemText primary="Nodes" />
                    </MenuItem>
                    <div />
                    <MenuItem component={NavLink} to={'/devices'}>
                        <ListItemIcon>
                            <SettingsCellIcon />
                        </ListItemIcon>
                        <ListItemText primary="Devices" />
                    </MenuItem>
                    <div />
                    <MenuItem component={NavLink} to={'/sources'}>
                        <ListItemIcon>
                            <SettingsInputAntennaIcon />
                        </ListItemIcon>
                        <ListItemText primary="Sources" />
                    </MenuItem>
                    <div />
                    <MenuItem component={NavLink} to={'/flows'}>
                        <ListItemIcon>
                            <CompareArrowsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Flows" />
                    </MenuItem>
                    <div />
                    <MenuItem component={NavLink} to={'/senders'}>
                        <ListItemIcon>
                            <CallMadeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Senders" />
                    </MenuItem>
                    <div />
                    <MenuItem component={NavLink} to={'/receivers'}>
                        <ListItemIcon>
                            <CallReceivedIcon />
                        </ListItemIcon>
                        <ListItemText primary="Receivers" />
                    </MenuItem>
                    <div />
                    <MenuItem component={NavLink} to={'/subscriptions'}>
                        <ListItemIcon>
                            <SwapVertIcon />
                        </ListItemIcon>
                        <ListItemText primary="Subscriptions" />
                    </MenuItem>
                    <div />
                    <MenuItem component={NavLink} to={'/events'}>
                        <ListItemIcon>
                            <AnnouncementIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logs" />
                    </MenuItem>
                    <div />
                </MenuList>
            </div>
        );
    }
}

NestedList.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(NestedList);

//export default withRouter(connect(mapStateToProps)(MyMenu));
