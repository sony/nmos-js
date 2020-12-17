import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button, ListButton, TopToolbar, useGetOne } from 'react-admin';
import get from 'lodash/get';
import EditIcon from '@material-ui/icons/Edit';
import JsonIcon from '../icons/JsonIcon';
import { useTheme } from '@material-ui/styles';
import { concatUrl } from '../settings';
import { resourceUrl } from '../dataProvider';

// cf. ResourceShowActions
export default function ConnectionShowActions({ basePath, id, resource }) {
    const { data } = useGetOne(resource, id);

    let json_href;
    if (data) {
        const tab = window.location.href.split('/').pop();
        if (tab === 'active' || tab === 'staged' || tab === 'transportfile') {
            json_href = concatUrl(data.$connectionAPI, `/${tab}`);
        } else if (tab === 'connect') {
        } else {
            json_href = resourceUrl(resource, `/${data.id}`);
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
            {json_href ? (
                <Button
                    label={'Raw'}
                    title={`View raw\n${json_href}`}
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
