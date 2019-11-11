import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import * as PropTypes from 'prop-types';

import AnnouncementIcon from '@material-ui/icons/Announcement';
import BuildIcon from '@material-ui/icons/Build';
import CallMadeIcon from '@material-ui/icons/CallMade';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import DvrIcon from '@material-ui/icons/Dvr';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import QueryIcon from '@material-ui/icons/HelpOutline';
import SettingsCellIcon from '@material-ui/icons/SettingsCell';
import SettingsInputAntennaIcon from '@material-ui/icons/SettingsInputAntenna';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import SettingsIcon from '@material-ui/icons/Settings';

import { Sidebar } from 'ra-ui-materialui';

Sidebar.defaultProps = {
    size: 240,
    closedSize: 72,
};

const styles = () => ({
    root: {
        width: '100%',
        maxWidth: 360,
    },
});

const NestedList = props => {
    const classes = { props };
    const [open, setOpen] = useState(false);

    return (
        <div className={classes.root}>
            <MenuList>
                <ListItem button onClick={() => setOpen(!open)}>
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                    {open ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Paper>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div">
                            <ListItem
                                button
                                component={NavLink}
                                to={'/settings'}
                            >
                                <ListItemIcon>
                                    <BuildIcon />
                                </ListItemIcon>
                                <ListItemText primary="General" />
                            </ListItem>
                            <ListItem
                                button
                                component={NavLink}
                                to={'/queryapis'}
                            >
                                <ListItemIcon>
                                    <QueryIcon />
                                </ListItemIcon>
                                <ListItemText
                                    style={{ whiteSpace: 'nowrap' }}
                                    primary="Query APIs"
                                />
                            </ListItem>
                        </List>
                    </Collapse>
                </Paper>
                <ListItem button component={NavLink} to={'/nodes'}>
                    <ListItemIcon>
                        <DvrIcon />
                    </ListItemIcon>
                    <ListItemText primary="Nodes" />
                </ListItem>
                <ListItem button component={NavLink} to={'/devices'}>
                    <ListItemIcon>
                        <SettingsCellIcon />
                    </ListItemIcon>
                    <ListItemText primary="Devices" />
                </ListItem>
                <ListItem button component={NavLink} to={'/sources'}>
                    <ListItemIcon>
                        <SettingsInputAntennaIcon />
                    </ListItemIcon>
                    <ListItemText primary="Sources" />
                </ListItem>
                <ListItem button component={NavLink} to={'/flows'}>
                    <ListItemIcon>
                        <CompareArrowsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Flows" />
                </ListItem>
                <ListItem button component={NavLink} to={'/senders'}>
                    <ListItemIcon>
                        <CallMadeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Senders" />
                </ListItem>
                <ListItem button component={NavLink} to={'/receivers'}>
                    <ListItemIcon>
                        <CallReceivedIcon />
                    </ListItemIcon>
                    <ListItemText primary="Receivers" />
                </ListItem>
                <ListItem button component={NavLink} to={'/subscriptions'}>
                    <ListItemIcon>
                        <SwapVertIcon />
                    </ListItemIcon>
                    <ListItemText primary="Subscriptions" />
                </ListItem>
                <ListItem button component={NavLink} to={'/events'}>
                    <ListItemIcon>
                        <AnnouncementIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logs" />
                </ListItem>
            </MenuList>
        </div>
    );
};

NestedList.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(NestedList);
