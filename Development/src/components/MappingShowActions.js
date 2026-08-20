import React from 'react';
import {
    Button,
    EditButton,
    ListButton,
    TopToolbar,
    useRecordContext,
} from 'react-admin';
import JsonIcon from '../icons/JsonIcon';
import { useTheme } from '@material-ui/styles';
import { concatUrl } from '../settings';
import { resourceUrl } from '../dataProvider';

// cf. ResourceShowActions
export default function MappingShowActions({ basePath, id, resource }) {
    const { record } = useRecordContext();
    let json_href;
    const theme = useTheme();
    const tab = window.location.href.split('/').pop();
    if (record) {
        if (tab === 'active_map' && record.$channelmappingAPI) {
            json_href = concatUrl(record.$channelmappingAPI, '/map/active');
        } else {
            json_href = resourceUrl(resource, `/${id}`);
        }
    }
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
            {record && tab === 'active_map' && record.$channelmappingAPI ? (
                <EditButton basePath={basePath} record={record} />
            ) : null}
            <ListButton
                label={'List'}
                title={'Return to ' + basePath}
                basePath={basePath}
            />
        </TopToolbar>
    );
}
