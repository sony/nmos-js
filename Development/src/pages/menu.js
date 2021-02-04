import React, { forwardRef } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import {
    Divider,
    ListItemIcon,
    ListItemText,
    MenuItem,
    MenuList,
} from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import SettingsIcon from '@material-ui/icons/Settings';
import { makeStyles } from '@material-ui/styles';
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

const NavLinkRef = forwardRef((props, ref) => (
    <NavLink innerRef={ref} {...props} />
));

const useStyles = makeStyles(theme => ({
    root: {
        paddingLeft: '24px',
        borderLeftWidth: '3px',
        borderLeftStyle: 'solid',
        borderLeftColor: 'transparent',
    },
    active: {
        borderLeftColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
        '& $icon': {
            color: theme.palette.primary.main,
        },
    },
    icon: {},
}));

const CustomMenuItem = ({ to, icon, label = labelize(to), ...props }) => {
    const classes = useStyles();
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
        <MenuItem
            onClick={refreshHandler}
            component={NavLinkRef}
            to={to}
            className={classes.root}
            activeClassName={classes.active}
            {...props}
        >
            <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>
            <ListItemText
                primary={label}
                primaryTypographyProps={{ noWrap: true }}
            />
        </MenuItem>
    );
};

const CustomMenu = () => {
    return (
        <MenuList>
            <CustomMenuItem to={'/'} exact icon={<HomeIcon />} label={'Home'} />
            <CustomMenuItem to={'/settings'} icon={<SettingsIcon />} />
            <Divider />
            <CustomMenuItem to={'/nodes'} icon={<NodeIcon />} />
            <CustomMenuItem to={'/devices'} icon={<DeviceIcon />} />
            <CustomMenuItem to={'/sources'} icon={<SourceIcon />} />
            <CustomMenuItem to={'/flows'} icon={<FlowIcon />} />
            <CustomMenuItem to={'/senders'} icon={<SenderIcon />} />
            <CustomMenuItem to={'/receivers'} icon={<ReceiverIcon />} />
            <CustomMenuItem to={'/subscriptions'} icon={<SubscriptionIcon />} />
            <Divider />
            <CustomMenuItem
                to={'/queryapis'}
                icon={<RegistryIcon />}
                label="Query APIs"
            />
            <CustomMenuItem to={'/logs'} icon={<RegistryLogsIcon />} />
        </MenuList>
    );
};

export default CustomMenu;
