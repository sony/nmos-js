import React from 'react';
import { useHistory } from 'react-router-dom';
import {
    Divider,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuList,
} from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/styles';
import { useRefresh } from 'react-admin';

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

const CustomMenu = () => {
    return (
        <MenuList>
            <NavLinkMenuItem to={'/'} icon={<HomeIcon />} label={'Home'} />
            <NavLinkMenuItem to={'/settings'} icon={<SettingsIcon />} />
            <Divider />
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
            <Divider />
            <NavLinkMenuItem
                to={'/queryapis'}
                icon={<RegistryIcon />}
                label="Query APIs"
            />
            <NavLinkMenuItem to={'/logs'} icon={<RegistryLogsIcon />} />
        </MenuList>
    );
};

export default CustomMenu;
