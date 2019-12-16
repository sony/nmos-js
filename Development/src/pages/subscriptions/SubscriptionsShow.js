import React from 'react';
import {
    BooleanField,
    Button,
    FunctionField,
    ListButton,
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
} from 'react-admin';
import Cookies from 'universal-cookie';
import JsonIcon from '../../icons/JsonIcon';
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

const SubscriptionsShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<SubscriptionsTitle />}>
        {data ? (
            <Button
                label={'Raw'}
                onClick={() =>
                    window.open(
                        cookies.get('Query API') +
                            '/' +
                            resource +
                            '/' +
                            data.id,
                        '_blank'
                    )
                }
                rel="noopener noreferrer"
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton basePath={basePath} />
    </TopToolbar>
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
