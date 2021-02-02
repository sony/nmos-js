import React, { Fragment, useEffect, useState } from 'react';
import { Link, Route } from 'react-router-dom';
import { IconButton, Paper, Tab, Tabs, Typography } from '@material-ui/core';
import {
    ArrayField,
    BooleanField,
    FunctionField,
    ReferenceField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    useNotify,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import copy from 'clipboard-copy';
import { useTheme } from '@material-ui/styles';
import LinkChipField from '../../components/LinkChipField';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import ItemArrayField from '../../components/ItemArrayField';
import MapObject from '../../components/ObjectField';
import {
    ParameterField,
    TRANSPORTS,
} from '../../components/ParameterRegisters';
import ResourceTitle from '../../components/ResourceTitle';
import SanitizedDivider from '../../components/SanitizedDivider';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
import labelize from '../../components/labelize';
import { ContentCopyIcon } from '../../icons';
import SenderTransportParamsCardsGrid from './SenderTransportParams';
import { queryVersion } from '../../settings';

export const SendersShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <SendersShowView {...props} />
        </ShowContextProvider>
    );
};

const SendersShowView = props => {
    const { record } = useRecordContext();

    const [useConnectionAPI, setUseConnectionAPI] = useState(false);

    useEffect(() => {
        if (get(record, '$connectionAPI') !== undefined) {
            setUseConnectionAPI(true);
        } else {
            setUseConnectionAPI(false);
        }
    }, [record]);

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
                        {['active', 'staged', 'transportfile'].map(key => (
                            <Tab
                                key={key}
                                label={labelize(key)}
                                value={`${props.match.url}/${key}`}
                                component={Link}
                                to={`${props.basePath}/${props.id}/show/${key}`}
                                disabled={
                                    !get(record, `$${key}`) || !useConnectionAPI
                                }
                            />
                        ))}
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
            <Route
                exact
                path={`${props.basePath}/${props.id}/show/transportfile`}
            >
                <ShowTransportFileTab record={record} />
            </Route>
        </>
    );
};

const ShowSummaryTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
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
                <SanitizedDivider />
                <ParameterField source="transport" register={TRANSPORTS} />
                <UrlField
                    style={{ fontSize: '14px' }}
                    label="Manifest Address"
                    source="manifest_href"
                />
                {queryVersion() >= 'v1.2' && (
                    <ItemArrayField
                        label="Interface Bindings"
                        source="interface_bindings"
                    />
                )}
                {queryVersion() >= 'v1.2' && (
                    <BooleanField label="Active" source="subscription.active" />
                )}
                <SanitizedDivider />
                <ReferenceField
                    label="Flow"
                    source="flow_id"
                    reference="flows"
                    link="show"
                >
                    <LinkChipField />
                </ReferenceField>
                <ReferenceField
                    label="Device"
                    source="device_id"
                    reference="devices"
                    link="show"
                >
                    <LinkChipField />
                </ReferenceField>
                {queryVersion() >= 'v1.2' &&
                    get(record, 'subscription.receiver_id') && (
                        <ReferenceField
                            label="Receiver"
                            source="subscription.receiver_id"
                            reference="receivers"
                            link="show"
                        >
                            <LinkChipField />
                        </ReferenceField>
                    )}
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowActiveTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(record, '$active.receiver_id') && (
                    <ReferenceField
                        basePath="/receivers"
                        label="Receiver"
                        source="$active.receiver_id"
                        reference="receivers"
                        link="show"
                    >
                        <LinkChipField />
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
                <ParameterField
                    label="Transport Type"
                    source="$transporttype"
                    register={TRANSPORTS}
                />
                <ArrayField
                    label="Transport Parameters"
                    source="$active.transport_params"
                >
                    <SenderTransportParamsCardsGrid record={record} />
                </ArrayField>
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowStagedTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(record, '$staged.receiver_id') && (
                    <ReferenceField
                        basePath="/receivers"
                        label="Receiver"
                        source="$staged.receiver_id"
                        reference="receivers"
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
                    <SenderTransportParamsCardsGrid record={record} />
                </ArrayField>
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowTransportFileTab = ({ record }) => {
    const notify = useNotify();
    const handleCopy = () => {
        copy(get(record, '$transportfile')).then(() => {
            notify('Transport file copied');
        });
    };

    return (
        <ShowView
            record={record}
            title={<ResourceTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <>
                    <IconButton
                        onClick={handleCopy}
                        style={{ float: 'right' }}
                        title="Copy"
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <pre style={{ fontFamily: 'inherit' }}>
                        <Typography>{get(record, '$transportfile')}</Typography>
                    </pre>
                </>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default SendersShow;
