import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import get from 'lodash/get';
import { useNotify, useRefresh } from 'react-admin';
import makeConnection from '../../components/makeConnection';
import { ActivateImmediateIcon, StageIcon } from '../../icons';
import dataProvider from '../../dataProvider';

const ConnectButtons = ({ senderData, receiverData }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [senderLegs, setSenderLegs] = useState(0);
    const [endpoint, setEndpoint] = useState('');

    const history = useHistory();
    const notify = useNotify();
    const refresh = useRefresh();

    const connect = (endpoint, senderLeg) => {
        const options = { singleSenderLeg: senderLeg };
        makeConnection(senderData.id, receiverData.id, endpoint, options)
            .then(() => {
                notify('Element updated', 'info');
                refresh();
                history.push(`/receivers/${receiverData.id}/show/${endpoint}`);
            })
            .catch(error => {
                if (error && error.hasOwnProperty('body'))
                    notify(
                        get(error.body, 'error') +
                            ' - ' +
                            get(error.body, 'code') +
                            ' - ' +
                            get(error.body, 'debug'),
                        'warning'
                    );
                notify(error.toString(), 'warning');
            });
    };

    const handleConnect = (endpoint, event) => {
        setEndpoint(endpoint);
        if (get(receiverData, '$staged.transport_params').length === 1) {
            const ref = event.currentTarget;
            dataProvider('GET_ONE', 'senders', {
                id: senderData.id,
            }).then(({ data: senderData }) => {
                if (get(senderData, '$staged.transport_params').length > 1) {
                    setSenderLegs(
                        get(senderData, '$staged.transport_params').length
                    );
                    setAnchorEl(ref);
                } else {
                    connect(endpoint);
                }
            });
        } else {
            connect(endpoint);
        }
    };

    return (
        <>
            <Button
                onClick={event => handleConnect('active', event)}
                color="primary"
                startIcon={<ActivateImmediateIcon />}
            >
                Activate
            </Button>
            <Button
                onClick={event => handleConnect('staged', event)}
                color="primary"
                startIcon={<StageIcon />}
            >
                Stage
            </Button>
            <Menu
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
                {[...Array(senderLegs).keys()].map(leg => (
                    <MenuItem
                        key={leg}
                        onClick={() => connect(endpoint, leg)}
                        style={{ fontSize: '0.875rem' }}
                    >
                        Leg {leg + 1}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default ConnectButtons;
