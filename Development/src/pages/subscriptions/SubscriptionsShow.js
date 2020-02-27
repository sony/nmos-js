import React, { Fragment } from 'react';
import {
    BooleanField,
    FunctionField,
    ListButton,
    ShowView,
    SimpleShowLayout,
    TextField,
    Toolbar,
    TopToolbar,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import DeleteButton from '../../components/DeleteButton';
import MapObject from '../../components/ObjectField';
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

const SubscriptionsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <Fragment>
            <ShowView
                title={<SubscriptionsTitle />}
                actions={<SubscriptionsShowActions />}
                {...controllerProps}
                {...props}
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
                    {QueryVersion() >= 'v1.3' && (
                        <BooleanField source="authorization" />
                    )}
                </SimpleShowLayout>
            </ShowView>
            {get(controllerProps.record, 'id') && (
                // Toolbar will override the DeleteButton resource prop
                <Toolbar resource="subscriptions" style={{ marginTop: 0 }}>
                    <DeleteButton id={get(controllerProps.record, 'id')} />
                </Toolbar>
            )}
        </Fragment>
    );
};

export default SubscriptionsShow;
