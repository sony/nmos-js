import React, { Fragment } from 'react';
import Link from 'react-router-dom/Link';
import { Route } from 'react-router-dom';
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
    ShowView,
    SimpleShowLayout,
    TextField,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import copy from 'clipboard-copy';
import { useTheme } from '@material-ui/styles';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import ItemArrayField from '../../components/ItemArrayField';
import JSONViewer from '../../components/JSONViewer';
import SenderTransportParamsCardsGrid from './SenderTransportParams';
import MapTags from '../../components/TagsField';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import QueryVersion from '../../components/QueryVersion';
import { ContentCopyIcon } from '../../icons';

const SendersTitle = ({ record }) => {
    return (
        <span>
            Sender:{' '}
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

const SendersShow = props => {
    const theme = useTheme();
    const tabBackgroundColor =
        theme.palette.type === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900];
    const controllerProps = useShowController(props);
    return (
        <Fragment>
            <div style={{ display: 'flex' }}>
                <Paper
                    style={{
                        alignSelf: 'end',
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
                        {get(controllerProps.record, '$connectionAPI') !==
                            undefined &&
                            ['active', 'staged', 'transportfile'].map(label => (
                                <Tab
                                    key={label}
                                    value={`${props.match.url}/${label}`}
                                    component={Link}
                                    to={`${props.basePath}/${props.id}/show/${label}`}
                                    disabled={
                                        !get(
                                            controllerProps.record,
                                            `$${label}`
                                        )
                                    }
                                    label={label}
                                />
                            ))}
                    </Tabs>
                </Paper>
                <span style={{ flexGrow: 1 }} />
                <ConnectionShowActions {...props} />
            </div>
            <Route
                exact
                path={`${props.basePath}/${props.id}/show/`}
                render={() => (
                    <ShowSummaryTab
                        {...props}
                        controllerProps={controllerProps}
                    />
                )}
            />
            <Route
                exact
                path={`${props.basePath}/${props.id}/show/active`}
                render={() => (
                    <ShowActiveTab
                        {...props}
                        controllerProps={controllerProps}
                    />
                )}
            />
            <Route
                exact
                path={`${props.basePath}/${props.id}/show/staged`}
                render={() => (
                    <ShowStagedTab
                        {...props}
                        controllerProps={controllerProps}
                    />
                )}
            />
            <Route
                exact
                path={`${props.basePath}/${props.id}/show/transportfile`}
                render={() => (
                    <ShowTransportFileTab record={controllerProps.record} />
                )}
            />
        </Fragment>
    );
};

const ShowSummaryTab = ({ controllerProps, ...props }) => {
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<SendersTitle />}
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
                            ? MapTags(record)
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
                {controllerProps.record && QueryVersion() >= 'v1.2' && (
                    <ItemArrayField
                        label="Interface Bindings"
                        source="interface_bindings"
                    />
                )}
                {controllerProps.record && QueryVersion() >= 'v1.2' && (
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
                {controllerProps.record &&
                    QueryVersion() >= 'v1.2' &&
                    controllerProps.record.subscription.receiver_id && (
                        <ReferenceField
                            label="Receiver"
                            source="subscription.receiver_id"
                            reference="receivers"
                            link="show"
                        >
                            <ChipConditionalLabel source="label" />
                        </ReferenceField>
                    )}
                )}
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowActiveTab = ({ controllerProps, ...props }) => {
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<SendersTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(controllerProps.record, '$active.receiver_id') && (
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
                    <SenderTransportParamsCardsGrid
                        record={controllerProps.record}
                    />
                </ArrayField>
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
            title={<SendersTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(controllerProps.record, '$staged.receiver_id') && (
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
                    <SenderTransportParamsCardsGrid
                        record={controllerProps.record}
                    />
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
            title={<SendersTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <Fragment>
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
                </Fragment>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default SendersShow;
