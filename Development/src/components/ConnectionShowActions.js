import { CardActions } from '@material-ui/core';
import { Button, ListButton } from 'ra-ui-materialui';
import React from 'react';
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
        if (tab === 'active' || tab === 'staged') {
            json_href =
                data.$connectionAPI +
                '/single/' +
                resource +
                '/' +
                data.id +
                '/' +
                tab;
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
            <ListButton title={'Return to ' + basePath} basePath={basePath} />
        </CardActions>
    );
}
