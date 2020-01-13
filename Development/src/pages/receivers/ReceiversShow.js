import React, { Fragment, useEffect, useState } from 'react';
import Link from 'react-router-dom/Link';
import { Route } from 'react-router-dom';
import {
    Button,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableRow,
    Tabs,
} from '@material-ui/core';
import {
    ArrayField,
    BooleanField,
    FunctionField,
    Loading,
    ReferenceField,
    ShowView,
    SimpleShowLayout,
    TextField,
    linkToRecord,
    useNotify,
    useRefresh,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import { useTheme } from '@material-ui/styles';
import ActiveField from '../../components/ActiveField';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import FilterPanel, {
    BooleanFilter,
    StringFilter,
} from '../../components/FilterPanel';
import ItemArrayField from '../../components/ItemArrayField';
import JSONViewer from '../../components/JSONViewer';
import makeConnection from '../../components/makeConnection';
import PaginationButtons from '../../components/PaginationButtons';
import QueryVersion from '../../components/QueryVersion';
import useGetList from '../../components/useGetList';
import ReceiverTransportParamsCardsGrid from './ReceiverTransportParams';
import MapTags from '../../components/TagsField';
import TAIField from '../../components/TAIField';
import TransportFileViewer from '../../components/TransportFileViewer';
import { ActivateImmediateIcon, StageIcon } from '../../icons';

const ReceiversTitle = ({ record }) => (
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

    useEffect(() => {
        if (get(controllerProps.record, '$connectionAPI') !== undefined) {
            setUseConnectionAPI(true);
        } else {
            setUseConnectionAPI(false);
        }
    }, [controllerProps.record]);

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
                path={`${props.basePath}/${props.id}/show/connect`}
                render={() => (
                    <ConnectionManagementTab
                        {...props}
                        controllerProps={controllerProps}
                        receiverData={controllerProps.record}
                    />
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
                            ? MapTags(record)
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

const ConnectionManagementTab = ({
    controllerProps,
    receiverData,
    ...props
}) => {
    const notify = useNotify();
    const refreshWholeView = useRefresh();
    const [filter, setFilter] = useState({
        transport: get(receiverData, 'transport'),
    });
    const [paginationURL, setPaginationURL] = useState(null);
    const { data, loaded, pagination } = useGetList({
        ...props,
        filter,
        paginationURL,
        resource: 'senders',
    });

    // receiverData initialises undefined, update when no longer null
    useEffect(() => {
        if (receiverData !== null)
            setFilter({ transport: get(receiverData, 'transport') });
    }, [receiverData]);

    if (!loaded) return <Loading />;

    const nextPage = label => {
        setPaginationURL(pagination[label]);
    };

    const connect = (senderID, receiverID, endpoint) => {
        makeConnection(senderID, receiverID, endpoint)
            .then(() => {
                notify('Element updated', 'info');
                refreshWholeView();
                props.history.push(
                    `${props.basePath}/${props.id}/show/${endpoint}`
                );
            })
            .catch(error => {
                if (error && error.hasOwnProperty('body'))
                    notify(
                        get(error.body, 'error') +
                            ' - ' +
                            get(error.body, 'code') +
                            ' - ' +
                            get(error.body, 'debug'),
                        'warning'
                    );
                notify(error.toString(), 'warning');
            });
    };

    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<ReceiversTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <Fragment>
                    <FilterPanel
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                    >
                        <StringFilter source="label" />
                        {QueryVersion() >= 'v1.2' && (
                            <BooleanFilter
                                source="subscription.active"
                                label="Active"
                            />
                        )}
                    </FilterPanel>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Sender
                                </TableCell>
                                {QueryVersion() >= 'v1.2' && (
                                    <TableCell>Active</TableCell>
                                )}
                                <TableCell>Flow</TableCell>
                                <TableCell>Format</TableCell>
                                {QueryVersion() >= 'v1.1' && (
                                    <TableCell>Media Type</TableCell>
                                )}
                                <TableCell>Connect</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map(item => (
                                <TableRow
                                    key={item.id}
                                    selected={
                                        get(receiverData, 'id') === item.id
                                    }
                                >
                                    <TableCell component="th" scope="row">
                                        {
                                            // Using linkToRecord as ReferenceField will
                                            // make a new unnecessary network request
                                        }
                                        <Link
                                            to={`${linkToRecord(
                                                '/senders',
                                                item.id
                                            )}/show`}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <ChipConditionalLabel
                                                record={item}
                                                source="label"
                                                label="ra.action.show"
                                            />
                                        </Link>
                                    </TableCell>
                                    {QueryVersion() >= 'v1.2' && (
                                        <TableCell>
                                            <ActiveField
                                                record={item}
                                                resource="senders"
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <ReferenceField
                                            record={item}
                                            basePath="/flows"
                                            label="Flow"
                                            source="flow_id"
                                            reference="flows"
                                            link="show"
                                        >
                                            <ChipConditionalLabel source="label" />
                                        </ReferenceField>
                                    </TableCell>
                                    <TableCell>
                                        <ReferenceField
                                            record={item}
                                            basePath="/flows"
                                            label="Flow"
                                            source="flow_id"
                                            reference="flows"
                                            link={false}
                                        >
                                            <TextField source="format" />
                                        </ReferenceField>
                                    </TableCell>
                                    {QueryVersion() >= 'v1.1' && (
                                        <TableCell>
                                            <ReferenceField
                                                record={item}
                                                basePath="/flows"
                                                label="Flow"
                                                source="flow_id"
                                                reference="flows"
                                                link={false}
                                            >
                                                <TextField source="media_type" />
                                            </ReferenceField>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Button
                                            onClick={() =>
                                                connect(
                                                    item.id,
                                                    get(receiverData, 'id'),
                                                    'active'
                                                )
                                            }
                                            color="primary"
                                            startIcon={
                                                <ActivateImmediateIcon />
                                            }
                                        >
                                            Activate
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                connect(
                                                    item.id,
                                                    get(receiverData, 'id'),
                                                    'staged'
                                                )
                                            }
                                            color="primary"
                                            startIcon={<StageIcon />}
                                        >
                                            Stage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Table>
                        <TableFooter>
                            <TableRow>
                                <TableCell style={{ whiteSpace: 'nowrap' }}>
                                    <PaginationButtons
                                        disabled={!pagination}
                                        nextPage={nextPage}
                                        {...props}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </Fragment>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default ReceiversShow;
