import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, useDelete, useNotify, useRefresh } from 'react-admin';
import get from 'lodash/get';
import { makeStyles } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { red } from '@material-ui/core/colors';

const useStyles = makeStyles(theme => ({
    root: {
        color: theme.palette.getContrastText(red[500]),
        backgroundColor: red[500],
        '&:hover': {
            backgroundColor: red[700],
        },
    },
}));

const DeleteButton = ({ resource, id }) => {
    const classes = useStyles();
    const [deleteOne, { loading, error }] = useDelete(resource, id);
    const notify = useNotify();
    const refresh = useRefresh();
    const history = useHistory();
    const handleButton = () => {
        deleteOne();
        if (!error) {
            notify('Element deleted', 'info');
        }
        if (window.location.hash.substr(1) === `/${resource}`) {
            refresh();
        } else {
            history.push(`/${resource}`);
        }
    };
    useEffect(() => {
        if (error) {
            if (error.hasOwnProperty('body'))
                notify(
                    get(error.body, 'error') +
                        ' - ' +
                        get(error.body, 'code') +
                        ' - ' +
                        get(error.body, 'debug'),
                    'warning'
                );
            notify(error.toString(), 'warning');
        }
    }, [error, notify]);
    return (
        <Button
            className={classes.root}
            disabled={loading}
            onClick={handleButton}
            label="Delete"
        >
            <DeleteIcon />
        </Button>
    );
};

export default DeleteButton;
