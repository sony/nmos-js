import React, { Fragment, useEffect, useState } from 'react';
import { Link, Route } from 'react-router-dom';
import { Paper, Tab, Tabs } from '@material-ui/core';
import {
    ArrayField,
    BooleanField,
    FunctionField,
    Loading,
    ReferenceField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import { useTheme } from '@material-ui/styles';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import ItemArrayField from '../../components/ItemArrayField';
import JSONViewer from '../../components/JSONViewer';
import ReceiverConstraintSetCardsGrid from './ReceiverConstraintSets';
import ReceiverTransportParamsCardsGrid from './ReceiverTransportParams';
import MapObject from '../../components/ObjectField';
import TAIField from '../../components/TAIField';
import TransportFileViewer from '../../components/TransportFileViewer';
import ConnectionManagementTab from './ConnectionManagementTab';
import { queryVersion } from '../../settings';

export const ReceiversTitle = ({ record }) => (
    <span>
        Receiver:{' '}
        {record
            ? record.label
                ? `${record.label}`
                : `${record.id}`
            : 'Unknown'}
    </span>
);

export const ReceiversShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <ReceiversShowView {...props} />
        </ShowContextProvider>
    );
};

const ReceiversShowView = props => {
    const { record } = useRecordContext();

    const [useConnectionAPI, setUseConnectionAPI] = useState(false);
    const [connectTab, setConnectTab] = useState(() => <Loading />);

    useEffect(() => {
        if (get(record, '$connectionAPI') !== undefined) {
            setUseConnectionAPI(true);
        } else {
            setUseConnectionAPI(false);
        }
    }, [record]);

    const { basePath } = props;
    useEffect(() => {
        if (record) {
            setConnectTab(() => (
                <ConnectionManagementTab
                    basePath={basePath}
                    receiverData={record}
                />
            ));
        }
    }, [basePath, record]);

    const theme = useTheme();
    const tabBackgroundColor =
        theme.palette.type === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900];
    return (
        <>
            <div style={{ display: 'flex' }}>
                <Paper
                    style={{
                        alignSelf: 'flex-end',
                        background: tabBackgroundColor,
                    }}
                >
                    <Tabs
                        value={props.location.pathname}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab
                            label="Summary"
                            value={`${props.match.url}`}
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/`}
                        />
                        {['active', 'staged'].map(label => (
                            <Tab
                                key={label}
                                label={label}
                                value={`${props.match.url}/${label}`}
                                component={Link}
                                to={`${props.basePath}/${props.id}/show/${label}`}
                                disabled={
                                    !get(record, `$${label}`) ||
                                    !useConnectionAPI
                                }
                            />
                        ))}
                        <Tab
                            label="Connect"
                            value={`${props.match.url}/connect`}
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/connect`}
                            disabled={
                                !get(record, '$staged') || !useConnectionAPI
                            }
                        />
                    </Tabs>
                </Paper>
                <span style={{ flexGrow: 1 }} />
                <ConnectionShowActions {...props} />
            </div>
            <Route exact path={`${props.basePath}/${props.id}/show/`}>
                <ShowSummaryTab record={record} {...props} />
            </Route>
            <Route exact path={`${props.basePath}/${props.id}/show/active`}>
                <ShowActiveTab record={record} {...props} />
            </Route>
            <Route exact path={`${props.basePath}/${props.id}/show/staged`}>
                <ShowStagedTab record={record} {...props} />
            </Route>
            <Route exact path={`${props.basePath}/${props.id}/show/connect`}>
                {connectTab}
            </Route>
        </>
    );
};

const ShowSummaryTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ReceiversTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                <TAIField source="version" />
                <TextField source="label" />
                <TextField source="description" />
                <FunctionField
                    label="Tags"
                    render={record =>
                        Object.keys(record.tags).length > 0
                            ? MapObject(record, 'tags')
                            : null
                    }
                />
                <hr />
                <TextField source="transport" />
                {queryVersion() >= 'v1.2' && (
                    <ItemArrayField
                        label="Interface Bindings"
                        source="interface_bindings"
                    />
                )}
                {record.caps.media_types && (
                    <ItemArrayField
                        label="Media Types Capability"
                        source="caps.media_types"
                    />
                )}
                {record.caps.event_types && (
                    <ItemArrayField
                        label="Event Types Capability"
                        source="caps.event_types"
                    />
                )}
                {record.caps.constraint_sets && (
                    <ArrayField
                        label="Constraint Sets"
                        source="caps.constraint_sets"
                    >
                        <ReceiverConstraintSetCardsGrid record={record} />
                    </ArrayField>
                )}
                {record.caps.version && (
                    <TAIField
                        label="Capabilities Version"
                        source="caps.version"
                    />
                )}
                <TextField source="format" />
                {queryVersion() >= 'v1.2' && (
                    <BooleanField label="Active" source="subscription.active" />
                )}
                {queryVersion() >= 'v1.2' && record.subscription.sender_id && (
                    <ReferenceField
                        label="Sender"
                        source="subscription.sender_id"
                        reference="senders"
                        link="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                )}
                <hr />
                <ReferenceField
                    label="Device"
                    source="device_id"
                    reference="devices"
                    link="show"
                >
                    <ChipConditionalLabel source="label" />
                </ReferenceField>
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowActiveTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ReceiversTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(record, '$active.sender_id') && (
                    <ReferenceField
                        basePath="/senders"
                        label="Sender"
                        source="$active.sender_id"
                        reference="senders"
                        link="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                )}
                <BooleanField
                    label="Master Enable"
                    source="$active.master_enable"
                />
                <TextField label="Mode" source="$active.activation.mode" />
                <TAIField
                    label="Requested Time"
                    source="$active.activation.requested_time"
                    mode="$active.activation.mode"
                />
                <TAIField
                    label="Activation Time"
                    source="$active.activation.activation_time"
                />
                <TextField label="Transport Type" source="$transporttype" />
                <ArrayField
                    label="Transport Parameters"
                    source="$active.transport_params"
                >
                    <ReceiverTransportParamsCardsGrid record={record} />
                </ArrayField>
                <TransportFileViewer endpoint="$active.transport_file.data" />
                <JSONViewer endpoint="$active" />
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowStagedTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ReceiversTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(record, '$staged.sender_id') && (
                    <ReferenceField
                        basePath="/senders"
                        label="Sender"
                        source="$staged.sender_id"
                        reference="senders"
                        link="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                )}
                <BooleanField
                    label="Master Enable"
                    source="$staged.master_enable"
                />
                <TextField label="Mode" source="$staged.activation.mode" />
                <TAIField
                    label="Requested Time"
                    source="$staged.activation.requested_time"
                    mode="$staged.activation.mode"
                />
                <TAIField
                    label="Activation Time"
                    source="$staged.activation.activation_time"
                />
                <TextField label="Transport Type" source="$transporttype" />
                <ArrayField
                    label="Transport Parameters"
                    source="$staged.transport_params"
                >
                    <ReceiverTransportParamsCardsGrid record={record} />
                </ArrayField>
                <TransportFileViewer endpoint="$staged.transport_file.data" />
                <JSONViewer endpoint="$staged" />
            </SimpleShowLayout>
        </ShowView>
    );
};

export default ReceiversShow;
