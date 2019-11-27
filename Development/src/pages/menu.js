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

import BuildIcon from '@material-ui/icons/Build';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import SettingsIcon from '@material-ui/icons/Settings';

import {
    DeviceIcon,
    FlowIcon,
    NodeIcon,
    ReceiverIcon,
    RegistryIcon,
    RegistryLogsIcon,
    SenderIcon,
    SourceIcon,
    SubscriptionIcon,
} from '../icons';

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
                                <RegistryIcon />
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
                    <NodeIcon />
                </ListItemIcon>
                <ListItemText primary="Nodes" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/devices'}>
                <ListItemIcon>
                    <DeviceIcon />
                </ListItemIcon>
                <ListItemText primary="Devices" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/sources'}>
                <ListItemIcon>
                    <SourceIcon />
                </ListItemIcon>
                <ListItemText primary="Sources" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/flows'}>
                <ListItemIcon>
                    <FlowIcon />
                </ListItemIcon>
                <ListItemText primary="Flows" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/senders'}>
                <ListItemIcon>
                    <SenderIcon />
                </ListItemIcon>
                <ListItemText primary="Senders" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/receivers'}>
                <ListItemIcon>
                    <ReceiverIcon />
                </ListItemIcon>
                <ListItemText primary="Receivers" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/subscriptions'}>
                <ListItemIcon>
                    <SubscriptionIcon />
                </ListItemIcon>
                <ListItemText primary="Subscriptions" />
            </StyledListItem>
            <StyledListItem button component={NavLink} to={'/logs'}>
                <ListItemIcon>
                    <RegistryLogsIcon />
                </ListItemIcon>
                <ListItemText primary="Logs" />
            </StyledListItem>
        </MenuList>
    );
};

export default NestedList;
