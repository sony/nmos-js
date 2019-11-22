import React, { useState } from 'react';
import NavLink from 'react-router-dom/NavLink';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/styles';

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

const StyledListItem = withStyles({
    root: {
        paddingLeft: '24px',
    },
})(ListItem);

const NestedList = () => {
    const [open, setOpen] = useState(false);
    return (
        <MenuList>
            <StyledListItem button onClick={() => setOpen(!open)}>
                <ListItemIcon>
                    <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
                {open ? <ExpandLess /> : <ExpandMore />}
            </StyledListItem>
            <Paper>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div">
                        <StyledListItem
                            button
                            component={NavLink}
                            to={'/settings'}
                            style={{ paddingLeft: '24px' }}
                        >
                            <ListItemIcon>
                                <BuildIcon />
                            </ListItemIcon>
                            <ListItemText primary="General" />
                        </StyledListItem>
                        <StyledListItem
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
                        </StyledListItem>
                    </List>
                </Collapse>
            </Paper>
            <StyledListItem button component={NavLink} to={'/nodes'}>
                <ListItemIcon>
                    <DvrIcon />
                </ListItemIcon>
                <ListItemText primary="Nodes" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/devices'}>
                <ListItemIcon>
                    <SettingsCellIcon />
                </ListItemIcon>
                <ListItemText primary="Devices" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/sources'}>
                <ListItemIcon>
                    <SettingsInputAntennaIcon />
                </ListItemIcon>
                <ListItemText primary="Sources" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/flows'}>
                <ListItemIcon>
                    <CompareArrowsIcon />
                </ListItemIcon>
                <ListItemText primary="Flows" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/senders'}>
                <ListItemIcon>
                    <CallMadeIcon />
                </ListItemIcon>
                <ListItemText primary="Senders" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/receivers'}>
                <ListItemIcon>
                    <CallReceivedIcon />
                </ListItemIcon>
                <ListItemText primary="Receivers" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/subscriptions'}>
                <ListItemIcon>
                    <SwapVertIcon />
                </ListItemIcon>
                <ListItemText primary="Subscriptions" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/events'}>
                <ListItemIcon>
                    <AnnouncementIcon />
                </ListItemIcon>
                <ListItemText primary="Logs" />
            </StyledListItem>
        </MenuList>
    );
};

export default NestedList;
