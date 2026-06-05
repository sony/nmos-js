import React, { Fragment, useEffect, useState } from 'react';
import { Link, Route } from 'react-router-dom';
import { Paper, Tab, Tabs } from '@material-ui/core';
import {
    ArrayField,
    BooleanField,
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
import LinkChipField from '../../components/LinkChipField';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import ItemArrayField from '../../components/ItemArrayField';
import ObjectField from '../../components/ObjectField';
import {
    FORMATS,
    ParameterField,
    TAGS,
    TRANSPORTS,
} from '../../components/ParameterRegisters';
import ResourceTitle from '../../components/ResourceTitle';
import SanitizedDivider from '../../components/SanitizedDivider';
import TAIField from '../../components/TAIField';
import TransportFileViewer from '../../components/TransportFileViewer';
import labelize from '../../components/labelize';
import ConnectionManagementTab from './ConnectionManagementTab';
import ReceiverConstraintSetCardsGrid from './ReceiverConstraintSets';
import ReceiverTransportParamsCardsGrid from './ReceiverTransportParams';
import { queryVersion } from '../../settings';

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
                        {['active', 'staged'].map(key => (
                            <Tab
                                key={key}
                                label={labelize(key)}
                                value={`${props.match.url}/${key}`}
                                component={Link}
                                to={`${props.basePath}/${props.id}/show/${key}`}
                                disabled={
                                    !get(record, `$${key}`) || !useConnectionAPI
                                }
                                name={key}
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
                            name="connect"
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
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" name="id" />
                <TAIField source="version" />
                <TextField source="label" name="label" />
                <TextField source="description" name="description" />
                <ObjectField register={TAGS} source="tags" />
                <SanitizedDivider />
                <ParameterField source="transport" register={TRANSPORTS} />
                {queryVersion() >= 'v1.2' && (
                    <ItemArrayField
                        label="Interface Bindings"
                        source="interface_bindings"
                    />
                )}
                {get(record, 'caps.media_types') && (
                    <ItemArrayField
                        label="Media Types Capability"
                        source="caps.media_types"
                    />
                )}
                {get(record, 'caps.event_types') && (
                    <ItemArrayField
                        label="Event Types Capability"
                        source="caps.event_types"
                    />
                )}
                {get(record, 'caps.constraint_sets') && (
                    <ArrayField
                        label="Constraint Sets"
                        source="caps.constraint_sets"
                    >
                        <ReceiverConstraintSetCardsGrid record={record} />
                    </ArrayField>
                )}
                {get(record, 'caps.version') && (
                    <TAIField
                        label="Capabilities Version"
                        source="caps.version"
                    />
                )}
                <ParameterField source="format" register={FORMATS} />
                {queryVersion() >= 'v1.2' && (
                    <BooleanField
                        label="Active"
                        source="subscription.active"
                        name="active"
                    />
                )}
                {queryVersion() >= 'v1.2' &&
                    get(record, 'subscription.sender_id') && (
                        <ReferenceField
                            label="Sender"
                            source="subscription.sender_id"
                            reference="senders"
                            link="show"
                        >
                            <LinkChipField />
                        </ReferenceField>
                    )}
                <SanitizedDivider />
                <ReferenceField
                    label="Device"
                    source="device_id"
                    reference="devices"
                    link="show"
                >
                    <LinkChipField />
                </ReferenceField>
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowActiveTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(record, '$active.sender_id') && (
                    <ReferenceField
                        basePath="/senders"
                        label="Sender"
                        source="$active.sender_id"
                        reference="senders"
                        link="show"
                        name="sender"
                    >
                        <LinkChipField />
                    </ReferenceField>
                )}
                <BooleanField
                    label="Master Enable"
                    source="$active.master_enable"
                    name="master_enable"
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
                <ParameterField
                    label="Transport Type"
                    source="$transporttype"
                    register={TRANSPORTS}
                />
                <ArrayField
                    label="Transport Parameters"
                    source="$active.transport_params"
                >
                    <ReceiverTransportParamsCardsGrid record={record} />
                </ArrayField>
                <TransportFileViewer endpoint="$active.transport_file.data" />
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowStagedTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
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
                        <LinkChipField />
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
                <ParameterField
                    label="Transport Type"
                    source="$transporttype"
                    register={TRANSPORTS}
                />
                <ArrayField
                    label="Transport Parameters"
                    source="$staged.transport_params"
                >
                    <ReceiverTransportParamsCardsGrid record={record} />
                </ArrayField>
                <TransportFileViewer endpoint="$staged.transport_file.data" />
            </SimpleShowLayout>
        </ShowView>
    );
};

export default ReceiversShow;
