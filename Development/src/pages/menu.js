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
import { MenuItem, MenuList } from '@material-ui/core';

const styles = theme => ({
    root: {
        width: '100%',
        maxWidth: 360,
    },
});

const settingStyle = {
    padding: '13px 15px',
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
                    <Collapse in={this.state.open} timeout="auto" unmountOnExit>
                        <List component="div" style={settingStyle}>
                            <NavLink
                                to="../../settings"
                                style={{
                                    paddingTop: '0',
                                    textDecoration: 'none',
                                }}
                            >
                                <MenuItem>
                                    <ListItemIcon>
                                        <BuildIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="General" />
                                </MenuItem>
                            </NavLink>
                            <NavLink
                                to="../../queryapis"
                                style={{
                                    textDecoration: 'none',
                                }}
                            >
                                <MenuItem>
                                    <ListItemIcon>
                                        <QueryIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Query APIs" />
                                </MenuItem>
                            </NavLink>
                        </List>
                    </Collapse>
                    <div></div>

                    <NavLink
                        to="../../nodes"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <DvrIcon />
                            </ListItemIcon>
                            <ListItemText primary="Nodes" />
                        </MenuItem>
                    </NavLink>
                    <div></div>
                    <NavLink
                        to="../../devices"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <SettingsCellIcon />
                            </ListItemIcon>
                            <ListItemText primary="Devices" />
                        </MenuItem>
                    </NavLink>
                    <div></div>

                    <NavLink
                        to="../../sources"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <SettingsInputAntennaIcon />
                            </ListItemIcon>
                            <ListItemText primary="Sources" />
                        </MenuItem>
                    </NavLink>
                    <div></div>
                    <NavLink
                        to="../../flows"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <CompareArrowsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Flows" />
                        </MenuItem>
                    </NavLink>
                    <div></div>

                    <NavLink
                        to="../../senders"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <CallMadeIcon />
                            </ListItemIcon>
                            <ListItemText primary="Senders" />
                        </MenuItem>
                    </NavLink>
                    <div></div>

                    <NavLink
                        to="../../receivers"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <CallReceivedIcon />
                            </ListItemIcon>
                            <ListItemText primary="Receivers" />
                        </MenuItem>
                    </NavLink>
                    <div></div>
                    <NavLink
                        to="../../subscriptions"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <SwapVertIcon />
                            </ListItemIcon>
                            <ListItemText primary="Subscriptions" />
                        </MenuItem>
                    </NavLink>
                    <div></div>
                    <div></div>
                    <NavLink
                        to="../../events"
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <AnnouncementIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logs" />
                        </MenuItem>
                    </NavLink>
                    <div></div>
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
