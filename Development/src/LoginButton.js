// in src/LoginButton.js
import * as React from 'react';
import { forwardRef } from 'react';
import { useLogin, useNotify } from 'react-admin';
import Button from '@material-ui/core/Button';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

const LoginButton = forwardRef((props, ref) => {
    const login = useLogin();
    const notify = useNotify();

    const handleClick = () => {
        login().catch(error => {
            notify(
                typeof error === 'string'
                    ? error
                    : 'Authentication error: ' + error.message,
                'error'
            );
        });
    };

    return (
        <Button
            color="inherit"
            size="small"
            style={{ textTransform: 'none' }}
            {...props}
            onClick={handleClick}
        >
            <AccountCircleIcon /> Login
        </Button>
    );
});

export default LoginButton;
