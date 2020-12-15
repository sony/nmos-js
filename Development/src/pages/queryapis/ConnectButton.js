import React, { useState } from 'react';
import { Menu, MenuItem, Snackbar } from '@material-ui/core';
import get from 'lodash/get';
import Button from '@material-ui/core/Button';
import { QUERY_API, apiUrl, setApiUrl } from '../../settings';
import { ConnectRegistryIcon } from '../../icons';

const ConnectButton = ({ record, variant = 'contained', size }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    if (!record) {
        return null;
    }

    const scheme = get(record, 'txt.api_proto');

    const makeQueryAPI = selectedAddress => {
        return (
            scheme +
            '://' +
            selectedAddress +
            ':' +
            get(record, 'port') +
            '/x-nmos/query/' +
            get(record, 'txt.api_ver').split(',').slice(-1)[0]
        );
    };

    const changeQueryAPI = selectedAddress => {
        setApiUrl(QUERY_API, makeQueryAPI(selectedAddress));
    };

    // heuristic decision about whether to give the user a single-click connect
    // or whether to pop up a menu of hosts to select from
    const hosts = (() => {
        const hostname = get(record, 'host_target');
        const addresses = get(record, 'addresses');
        if (!hostname.endsWith('local.')) {
            // i.e. unicast DNS-SD hostname
            return [hostname];
        } else if (scheme === 'http' && addresses.length === 1) {
            // i.e. mDNS hostname resolved to a single address used with HTTP
            return [addresses[0]];
        } else {
            // i.e. mDNS hostname resolved to multiple addresses or used with HTTPS
            return [hostname, ...addresses];
        }
    })();

    const handleButtonClick = event => {
        if (hosts.length > 1) {
            setAnchorEl(event.currentTarget);
        } else {
            changeQueryAPI(hosts[0]);
            setSnackbarOpen(true);
        }
    };

    const handleMenuItemClick = option => {
        changeQueryAPI(option);
        setAnchorEl(null);
        setSnackbarOpen(true);
    };

    return (
        <>
            <Button
                color="primary"
                onClick={handleButtonClick}
                startIcon={<ConnectRegistryIcon />}
                variant={variant}
                size={
                    size ? size : variant === 'contained' ? 'medium' : 'small'
                }
            >
                Connect
            </Button>
            <Menu
                id="address-menu"
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                {hosts.map(option => (
                    <MenuItem
                        key={option}
                        onClick={() => handleMenuItemClick(option)}
                        style={{ fontSize: '0.875rem' }}
                    >
                        {makeQueryAPI(option)}
                    </MenuItem>
                ))}
            </Menu>
            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                open={snackbarOpen}
                onClose={() => setSnackbarOpen(false)}
                autoHideDuration={3000}
                ContentProps={{
                    'aria-describedby': 'text',
                }}
                message={`Connected to: ${apiUrl(QUERY_API)}`}
            />
        </>
    );
};

export default ConnectButton;
