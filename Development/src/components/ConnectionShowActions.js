import React from 'react';
import NavLink from 'react-router-dom/NavLink';
import { Button, ListButton, TopToolbar, useGetOne } from 'react-admin';
import get from 'lodash/get';
import Cookies from 'universal-cookie';
import EditIcon from '@material-ui/icons/Edit';
import JsonIcon from '../icons/JsonIcon';
import { useTheme } from '@material-ui/styles';

const cookies = new Cookies();

export default function ConnectionShowActions({ basePath, id, resource }) {
    const { data } = useGetOne(resource, id);

    let json_href;
    if (data) {
        const tab = window.location.href.split('/').pop();
        json_href = cookies.get('Query API') + '/' + resource + '/' + data.id;
        if (tab === 'active' || tab === 'staged' || tab === 'transportfile') {
            json_href = data.$connectionAPI + '/' + tab;
        }
    }
    const theme = useTheme();
    return (
        <TopToolbar
            style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                paddingTop: theme.spacing(4),
                paddingBottom: 0,
                paddingRight: theme.spacing(2),
                minHeight: theme.spacing(5),
            }}
        >
            {data ? (
                <Button
                    label={'Raw'}
                    title={'View raw'}
                    onClick={() => window.open(json_href, '_blank')}
                    rel="noopener noreferrer"
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
        </TopToolbar>
    );
}
