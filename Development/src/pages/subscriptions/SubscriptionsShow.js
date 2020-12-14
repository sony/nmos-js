import React from 'react';
import {
    BooleanField,
    FunctionField,
    ListButton,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    Toolbar,
    TopToolbar,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import DeleteButton from '../../components/DeleteButton';
import MapObject from '../../components/ObjectField';
import RawButton from '../../components/RawButton';
import UrlField from '../../components/URLField';
import { queryVersion } from '../../settings';

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

export const SubscriptionsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <SubscriptionsShowView {...props} />
        </ShowContextProvider>
    );
};

const SubscriptionsShowView = props => {
    const { record } = useRecordContext();
    return (
        <>
            <ShowView
                {...props}
                title={<SubscriptionsTitle />}
                actions={<SubscriptionsShowActions />}
            >
                <SimpleShowLayout>
                    <TextField source="id" label="ID" />
                    <TextField source="resource_path" label="Resource Path" />
                    <UrlField source="ws_href" label="WebSocket Address" />
                    <TextField
                        source="max_update_rate_ms"
                        label="Max Update Rate (ms)"
                    />
                    <FunctionField
                        label="Params"
                        render={record =>
                            Object.keys(record.params).length > 0
                                ? MapObject(record, 'params')
                                : null
                        }
                    />
                    <hr />
                    <BooleanField source="persist" />
                    <BooleanField source="secure" />
                    {queryVersion() >= 'v1.3' && (
                        <BooleanField source="authorization" />
                    )}
                </SimpleShowLayout>
            </ShowView>
            {get(record, 'id') && (
                // Toolbar will override the DeleteButton resource prop
                <Toolbar resource="subscriptions" style={{ marginTop: 0 }}>
                    <DeleteButton id={get(record, 'id')} />
                </Toolbar>
            )}
        </>
    );
};

export default SubscriptionsShow;
