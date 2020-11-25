import React, { Fragment, useEffect, useState } from 'react';
import { Link, Route } from 'react-router-dom';
import { Paper, Tab, Tabs } from '@material-ui/core';
import {
    ArrayField,
    BooleanField,
    FunctionField,
    Loading,
    ReferenceField,
    ShowView,
    SimpleShowLayout,
    TextField,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import { useTheme } from '@material-ui/styles';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import ItemArrayField from '../../components/ItemArrayField';
import JSONViewer from '../../components/JSONViewer';
import QueryVersion from '../../components/QueryVersion';
import ReceiverConstraintSetCardsGrid from './ReceiverConstraintSets';
import ReceiverTransportParamsCardsGrid from './ReceiverTransportParams';
import MapObject from '../../components/ObjectField';
import TAIField from '../../components/TAIField';
import TransportFileViewer from '../../components/TransportFileViewer';
import ConnectionManagementTab from './ConnectionManagementTab';

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

const ReceiversShow = props => {
    const [useConnectionAPI, setUseConnectionAPI] = useState(false);
    const controllerProps = useShowController(props);
    const [connectTab, setConnectTab] = useState(() => <Loading />);

    useEffect(() => {
        if (get(controllerProps.record, '$connectionAPI') !== undefined) {
            setUseConnectionAPI(true);
        } else {
            setUseConnectionAPI(false);
        }
    }, [controllerProps.record]);

    const { basePath } = props;
    const receiverData = controllerProps.record;
    useEffect(() => {
        if (receiverData) {
            setConnectTab(() => (
                <ConnectionManagementTab
                    basePath={basePath}
                    receiverData={receiverData}
                />
            ));
        }
    }, [basePath, receiverData]);

    const theme = useTheme();
    const tabBackgroundColor =
        theme.palette.type === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900];
    return (
        <Fragment>
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
                                    !get(controllerProps.record, `$${label}`) ||
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
                                !get(controllerProps.record, '$staged') ||
                                !useConnectionAPI
                            }
                        />
                    </Tabs>
                </Paper>
                <span style={{ flexGrow: 1 }} />
                <ConnectionShowActions {...props} />
            </div>
            <Route exact path={`${props.basePath}/${props.id}/show/`}>
                <ShowSummaryTab {...props} controllerProps={controllerProps} />
            </Route>
            <Route exact path={`${props.basePath}/${props.id}/show/active`}>
                <ShowActiveTab {...props} controllerProps={controllerProps} />
            </Route>
            <Route exact path={`${props.basePath}/${props.id}/show/staged`}>
                <ShowStagedTab {...props} controllerProps={controllerProps} />
            </Route>
            <Route exact path={`${props.basePath}/${props.id}/show/connect`}>
                {connectTab}
            </Route>
        </Fragment>
    );
};

const ShowSummaryTab = ({ controllerProps, ...props }) => {
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<ReceiversTitle />}
            actions={<Fragment />}
        >
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
                {controllerProps.record && QueryVersion() >= 'v1.2' && (
                    <ItemArrayField
                        label="Interface Bindings"
                        source="interface_bindings"
                    />
                )}
                {controllerProps.record &&
                    controllerProps.record.caps.media_types && (
                        <ItemArrayField
                            label="Media Types Capability"
                            source="caps.media_types"
                        />
                    )}
                {controllerProps.record &&
                    controllerProps.record.caps.event_types && (
                        <ItemArrayField
                            label="Event Types Capability"
                            source="caps.event_types"
                        />
                    )}
                {controllerProps.record &&
                    controllerProps.record.caps.constraint_sets && (
                        <ArrayField
                            label="Constraint Sets"
                            source="caps.constraint_sets"
                        >
                            <ReceiverConstraintSetCardsGrid
                                record={controllerProps.record}
                            />
                        </ArrayField>
                    )}
                {controllerProps.record &&
                    controllerProps.record.caps.version && (
                        <TAIField source="version" />
                    )}
                <TextField source="format" />
                {controllerProps.record && QueryVersion() >= 'v1.2' && (
                    <BooleanField label="Active" source="subscription.active" />
                )}
                {controllerProps.record &&
                    QueryVersion() >= 'v1.2' &&
                    controllerProps.record.subscription.sender_id && (
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

const ShowActiveTab = ({ controllerProps, ...props }) => {
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<ReceiversTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(controllerProps.record, '$active.sender_id') && (
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
                    <ReceiverTransportParamsCardsGrid
                        record={controllerProps.record}
                    />
                </ArrayField>
                <TransportFileViewer endpoint="$active.transport_file.data" />
                <JSONViewer endpoint="$active" />
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowStagedTab = ({ controllerProps, ...props }) => {
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<ReceiversTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(controllerProps.record, '$staged.sender_id') && (
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
                    <ReceiverTransportParamsCardsGrid
                        record={controllerProps.record}
                    />
                </ArrayField>
                <TransportFileViewer endpoint="$staged.transport_file.data" />
                <JSONViewer endpoint="$staged" />
            </SimpleShowLayout>
        </ShowView>
    );
};

export default ReceiversShow;
