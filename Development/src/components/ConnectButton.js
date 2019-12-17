import React, { Fragment, useState } from 'react';
import { Menu, MenuItem, Snackbar } from '@material-ui/core';
import get from 'lodash/get';
import Button from '@material-ui/core/Button';
import { changeAPIEndpoint } from '../dataProvider';
import { ConnectRegistryIcon } from '../icons';

const ConnectButton = ({ record }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [queryAPI, setQueryAPI] = useState(
        changeAPIEndpoint('Query API', '')
    );

    const makeQueryAPIAddress = selectedAddress => {
        return (
            get(record, 'txt.api_proto') +
            '://' +
            selectedAddress +
            ':' +
            get(record, 'port') +
            '/x-nmos/query/' +
            get(record, 'txt.api_ver')
                .split(',')
                .slice(-1)[0]
        );
    };

    const changeQueryAPI = selectedAddress => {
        const newQueryAPI = makeQueryAPIAddress(selectedAddress);
        setQueryAPI(newQueryAPI);
        changeAPIEndpoint('Query API', newQueryAPI);
    };

    if (!get(record, 'addresses')) {
        return null;
    }

    const handleButtonClick = event => {
        if (get(record, 'addresses').length > 1) {
            setAnchorEl(event.currentTarget);
        } else {
            changeQueryAPI(get(record, 'addresses')[0]);
            setSnackbarOpen(true);
        }
    };

    const handleMenuItemClick = option => {
        changeQueryAPI(option);
        setAnchorEl(null);
        setSnackbarOpen(true);
    };

    return (
        <Fragment>
            <Button
                color="primary"
                variant="contained"
                onClick={handleButtonClick}
                startIcon={<ConnectRegistryIcon />}
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
                {get(record, 'addresses').map(option => (
                    <MenuItem
                        key={option}
                        onClick={() => handleMenuItemClick(option)}
                    >
                        {makeQueryAPIAddress(option)}
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
                message={<span id="text">Connected to: {queryAPI}</span>}
            />
        </Fragment>
    );
};

export default ConnectButton;
