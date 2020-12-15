import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button, useDelete, useNotify, useRefresh } from 'react-admin';
import get from 'lodash/get';
import { makeStyles } from '@material-ui/core';
import { fade } from '@material-ui/core/styles/colorManipulator';
import DeleteIcon from '@material-ui/icons/Delete';

const useStyles = makeStyles(theme => ({
    contained: {
        color: theme.palette.error.contrastText,
        backgroundColor: theme.palette.error.main,
        '&:hover': {
            backgroundColor: theme.palette.error.dark,
            // Reset on touch devices, it doesn't add specificity
            '@media (hover: none)': {
                backgroundColor: theme.palette.error.main,
            },
        },
    },
    text: {
        color: theme.palette.error.main,
        '&:hover': {
            backgroundColor: fade(
                theme.palette.error.main,
                theme.palette.action.hoverOpacity
            ),
            // Reset on touch devices, it doesn't add specificity
            '@media (hover: none)': {
                backgroundColor: 'transparent',
            },
        },
    },
}));

const DeleteButton = ({
    resource,
    id,
    record,
    variant = 'contained',
    size,
}) => {
    const classes = useStyles();
    const notify = useNotify();
    const refresh = useRefresh();
    const history = useHistory();
    const [deleteOne, { loading }] = useDelete(resource, id, record, {
        onSuccess: () => {
            notify('Element deleted', 'info');
            if (window.location.hash.substr(1) === `/${resource}`) {
                refresh();
            } else {
                history.push(`/${resource}`);
            }
        },
        onFailure: error => {
            if (error.hasOwnProperty('body')) {
                notify(
                    get(error.body, 'error') +
                        ' - ' +
                        get(error.body, 'code') +
                        ' - ' +
                        get(error.body, 'debug'),
                    'warning'
                );
            }
            notify(error.toString(), 'warning');
        },
    });
    return (
        <Button
            className={
                variant === 'contained' ? classes.contained : classes.text
            }
            disabled={loading}
            onClick={deleteOne}
            label="Delete"
            variant={variant}
            size={size ? size : variant === 'contained' ? 'medium' : 'small'}
        >
            <DeleteIcon />
        </Button>
    );
};

export default DeleteButton;
