import React from 'react';
import {
    BooleanField,
    FunctionField,
    ListButton,
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
} from 'react-admin';
import MapTags from '../../components/TagsField';
import RawButton from '../../components/RawButton';
import UrlField from '../../components/URLField';
import QueryVersion from '../../components/QueryVersion';

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
        {data ? <RawButton record={data} resource={resource} /> : null}
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
            {QueryVersion() >= 'v1.3' && (
                <BooleanField source="authorization" />
            )}
        </SimpleShowLayout>
    </Show>
);

export default SubscriptionsShow;
