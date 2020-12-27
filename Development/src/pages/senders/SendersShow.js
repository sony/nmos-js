import React, { Fragment, useEffect, useState } from 'react';
import { Link, Route } from 'react-router-dom';
import {
    Button as MaterialButton,
    Paper,
    Snackbar,
    Tab,
    Tabs,
    Typography,
} from '@material-ui/core';
import {
    ArrayField,
    BooleanField,
    FunctionField,
    ReferenceField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import copy from 'clipboard-copy';
import { useTheme } from '@material-ui/styles';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import ItemArrayField from '../../components/ItemArrayField';
import JSONViewer from '../../components/JSONViewer';
import MapObject from '../../components/ObjectField';
import ResourceTitle from '../../components/ResourceTitle';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
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
                        {['active', 'staged', 'transportfile'].map(label => (
                            <Tab
                                key={label}
                                value={`${props.match.url}/${label}`}
                                component={Link}
                                to={`${props.basePath}/${props.id}/show/${label}`}
                                disabled={
                                    !get(record, `$${label}`) ||
                                    !useConnectionAPI
                                }
                                label={label}
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
                <hr />
                <TextField source="transport" />
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
                <hr />
                <ReferenceField
                    label="Flow"
                    source="flow_id"
                    reference="flows"
                    link="show"
                >
                    <ChipConditionalLabel source="label" />
                </ReferenceField>
                <ReferenceField
                    label="Device"
                    source="device_id"
                    reference="devices"
                    link="show"
                >
                    <ChipConditionalLabel source="label" />
                </ReferenceField>
                {queryVersion() >= 'v1.2' && record.subscription.receiver_id && (
                    <ReferenceField
                        label="Receiver"
                        source="subscription.receiver_id"
                        reference="receivers"
                        link="show"
                    >
                        <ChipConditionalLabel source="label" />
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
                    <SenderTransportParamsCardsGrid record={record} />
                </ArrayField>
                <JSONViewer endpoint="$active" />
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
                    <SenderTransportParamsCardsGrid record={record} />
                </ArrayField>
                <JSONViewer endpoint="$staged" />
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowTransportFileTab = ({ record }) => {
    const [open, setOpen] = React.useState(false);
    const handleClick = () => {
        copy(get(record, `$transportfile`)).then(() => {
            setOpen(true);
        });
    };
    const handleClose = () => {
        setOpen(false);
    };
    return (
        <ShowView
            record={record}
            title={<ResourceTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <>
                    <pre style={{ fontFamily: 'inherit' }}>
                        <Typography>{get(record, '$transportfile')}</Typography>
                    </pre>
                    <MaterialButton
                        variant="contained"
                        color="primary"
                        onClick={handleClick}
                        startIcon={<ContentCopyIcon />}
                    >
                        Copy
                    </MaterialButton>
                    <Snackbar
                        open={open}
                        onClose={handleClose}
                        autoHideDuration={3000}
                        message={<span>Transport File Copied</span>}
                    />
                </>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default SendersShow;
