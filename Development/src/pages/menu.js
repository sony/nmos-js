import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/styles';
import { useRefresh } from 'react-admin';

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

import labelize from '../components/labelize';

const StyledListItem = withStyles({
    root: {
        paddingLeft: '24px',
    },
})(ListItem);

const NavLinkMenuItem = ({ to, icon, label = labelize(to), ...props }) => {
    const history = useHistory();
    const refresh = useRefresh();
    const refreshHandler = () => {
        if (window.location.hash.substr(1) === to) {
            refresh();
        } else {
            history.push(to);
        }
    };
    return (
        <StyledListItem button onClick={refreshHandler} {...props}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText
                primary={label}
                primaryTypographyProps={{ noWrap: true }}
            />
        </StyledListItem>
    );
};

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
                    <List>
                        <NavLinkMenuItem
                            to={'/settings'}
                            icon={<BuildIcon />}
                            style={{ paddingLeft: '24px' }}
                        />
                        <NavLinkMenuItem
                            to={'/queryapis'}
                            icon={<RegistryIcon />}
                            label="Query APIs"
                        />
                    </List>
                </Collapse>
            </Paper>
            <NavLinkMenuItem to={'/nodes'} icon={<NodeIcon />} />
            <NavLinkMenuItem to={'/devices'} icon={<DeviceIcon />} />
            <NavLinkMenuItem to={'/sources'} icon={<SourceIcon />} />
            <NavLinkMenuItem to={'/flows'} icon={<FlowIcon />} />
            <NavLinkMenuItem to={'/senders'} icon={<SenderIcon />} />
            <NavLinkMenuItem to={'/receivers'} icon={<ReceiverIcon />} />
            <NavLinkMenuItem
                to={'/subscriptions'}
                icon={<SubscriptionIcon />}
            />
            <NavLinkMenuItem to={'/logs'} icon={<RegistryLogsIcon />} />
        </MenuList>
    );
};

export default NestedList;
