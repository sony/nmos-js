import { CardActions } from '@material-ui/core';
import { Button, ListButton } from 'react-admin';
import React from 'react';
import NavLink from 'react-router-dom/NavLink';
import EditIcon from '@material-ui/icons/Edit';
import get from 'lodash/get';
import Cookies from 'universal-cookie';
import JsonIcon from './JsonIcon';

const cookies = new Cookies();

const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

export default function ConnectionShowActions({ basePath, data, resource }) {
    let json_href;
    if (data) {
        const tab = window.location.href.split('/').pop();
        json_href = cookies.get('Query API') + '/' + resource + '/' + data.id;
        if (tab === 'active' || tab === 'staged' || tab === 'transportfile') {
            json_href = data.$connectionAPI + '/' + tab;
        }
    }
    return (
        <CardActions style={cardActionStyle}>
            {data ? (
                <Button
                    label={'Raw'}
                    title={'View raw'}
                    onClick={() => window.open(json_href, '_blank')}
                >
                    <JsonIcon />
                </Button>
            ) : null}
            <ListButton
                label={'List'}
                title={'Return to ' + basePath}
                basePath={basePath}
            />
            {get(data, '$connectionAPI') != null ? (
                <Button
                    label={'Edit'}
                    component={NavLink}
                    to={`${basePath}/${data.id}`}
                >
                    <EditIcon />
                </Button>
            ) : null}
        </CardActions>
    );
}
