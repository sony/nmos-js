import React from 'react';
import Button from '@material-ui/core/Button';
import { changeAPIEndpoint } from '../dataProvider';
import { Snackbar } from '@material-ui/core';
import { ConnectRegistryIcon } from '../icons';

let longQuery = '';

class ConnectButtonSnackbar extends React.Component {
    state = {
        open: false,
        vertical: 'top',
        horizontal: 'center',
    };
    handleClick = state => () => {
        changeAPIEndpoint('Query API', longQuery);
        this.setState({ open: true, ...state });
    };
    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ open: false });
    };
    render() {
        const { vertical, horizontal, open } = this.state;
        return (
            <div>
                <Button
                    color="primary"
                    onClick={this.handleClick({
                        vertical: 'top',
                        horizontal: 'center',
                    })}
                    startIcon={<ConnectRegistryIcon />}
                >
                    Connect
                </Button>

                <Snackbar
                    anchorOrigin={{ vertical, horizontal }}
                    open={open}
                    autoHideDuration={1600}
                    onClose={this.handleClose}
                    ContentProps={{
                        'aria-describedby': 'text',
                    }}
                    message={<span id="text">Connected to: {longQuery}</span>}
                />
            </div>
        );
    }
}

const makeNewQuery = record => {
    longQuery =
        record.txt.api_proto +
        '://' +
        record.addresses[0] +
        ':' +
        record.port +
        '/x-nmos/query/' +
        record.txt.api_ver.split(',').slice(-1)[0];
};

const ConnectButton = ({ record }) => (
    <ConnectButtonSnackbar onClick={makeNewQuery(record)} />
);

export default ConnectButton;
