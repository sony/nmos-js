import React from 'react';
import { useFormState } from 'react-final-form';
import { Button } from '@material-ui/core';
import { Toolbar } from 'react-admin';
import get from 'lodash/get';
import {
    ActivateImmediateIcon,
    ActivateScheduledIcon,
    CancelScheduledActivationIcon,
    StageIcon,
} from '../icons';

const ConnectionEditToolbar = props => {
    const formState = useFormState().values;
    const buttonProps = (() => {
        if (get(formState, '$staged.activation.activation_time')) {
            return [
                'Cancel Scheduled Activation',
                <CancelScheduledActivationIcon />,
            ];
        }
        switch (get(formState, '$staged.activation.mode')) {
            case 'activate_immediate':
                return ['Activate', <ActivateImmediateIcon />];
            case 'activate_scheduled_relative':
            case 'activate_scheduled_absolute':
                return ['Activate Scheduled', <ActivateScheduledIcon />];
            default:
                return ['Stage', <StageIcon />];
        }
    })();
    return (
        <Toolbar {...props}>
            <Button
                onClick={() => props.handleSubmitWithRedirect()}
                variant="contained"
                color="primary"
                disabled={
                    get(formState, '$staged.activation.activation_time') &&
                    get(formState, '$staged.activation.mode') !== null
                }
                startIcon={buttonProps[1]}
            >
                {buttonProps[0]}
            </Button>
        </Toolbar>
    );
};

export default ConnectionEditToolbar;
