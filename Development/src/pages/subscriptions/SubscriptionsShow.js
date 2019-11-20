import React from 'react';
import { CardActions, hr } from '@material-ui/core';
import {
    BooleanField,
    Button,
    FunctionField,
    ListButton,
    Show,
    SimpleShowLayout,
    TextField,
} from 'react-admin';
import Cookies from 'universal-cookie';
import JsonIcon from '../../components/JsonIcon';
import MapTags from '../../components/TagsField';
import UrlField from '../../components/URLField';

const cookies = new Cookies();

const SubscriptionsTitle = ({ record }) => {
    return (
        <span>
            Subscription:{' '}
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

const SubscriptionsShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<SubscriptionsTitle />} style={cardActionStyle}>
        {data ? (
            <Button
                label={'Raw'}
                href={cookies.get('Query API') + '/' + resource + '/' + data.id}
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton basePath={basePath} />
    </CardActions>
);

const SubscriptionsShow = props => (
    <Show
        title={<SubscriptionsTitle />}
        actions={<SubscriptionsShowActions />}
        {...props}
    >
        <SimpleShowLayout>
            <TextField source="id" label="ID" />
            <TextField source="resource_path" />
            <UrlField label="WebSocket Address" source="ws_href" />
            <TextField
                label="Max Update Rate (ms)"
                source="max_update_rate_ms"
            />
            <FunctionField
                label="Params"
                render={record =>
                    Object.keys(record.params).length > 0
                        ? MapTags(record)
                        : null
                }
            />
            <hr />
            <BooleanField source="persist" />
            <BooleanField source="secure" />
        </SimpleShowLayout>
    </Show>
);

export default SubscriptionsShow;
