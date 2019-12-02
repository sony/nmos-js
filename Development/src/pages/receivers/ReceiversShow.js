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
    Error,
    FunctionField,
    Loading,
    ReferenceField,
    ShowButton,
    ShowView,
    SimpleShowLayout,
    TextField,
    useRefresh,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import { useTheme } from '@material-ui/styles';
import CheckIcon from '@material-ui/icons/Check';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import ClearIcon from '@material-ui/icons/Clear';
import ConnectionShowActions from '../../components/ConnectionShowActions';
import FilterField from '../../components/FilterField';
import ItemArrayField from '../../components/ItemArrayField';
import JSONViewer from '../../components/JSONViewer';
import makeConnection from '../../components/makeConnection';
import PaginationButton from '../../components/PaginationButton';
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
                        {get(controllerProps.record, '$connectionAPI') !==
                            undefined &&
                            ['active', 'staged'].map(label => (
                                <Tab
                                    key={label}
                                    label={label}
                                    value={`${props.match.url}/${label}`}
                                    component={Link}
                                    to={`${props.basePath}/${props.id}/show/${label}`}
                                    disabled={
                                        !get(
                                            controllerProps.record,
                                            `$${label}`
                                        )
                                    }
                                />
                            ))}
                        <Tab
                            label="Connect"
                            value={`${props.match.url}/connect`}
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/connect`}
                            disabled={!get(controllerProps.record, '$active')}
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
    const refresh = useRefresh();
    const [filter, setFilter] = useState({
        transport: get(receiverData, 'transport'),
    });
    const [paginationCursor, setPaginationCursor] = useState(null);
    // As the paginationCursor variable has not changed we need to force an update
    const [seed, setSeed] = useState(Math.random());

    const { data, error, loaded } = useGetList({
        ...props,
        filter,
        paginationCursor,
        resource: 'senders',
        seed,
    });

    const nextPage = label => {
        setPaginationCursor(label);
        setSeed(Math.random());
    };

    const changeFilter = (filterValue, name) => {
        let currentFilter = filter;
        if (filterValue) {
            currentFilter[name] = filterValue;
        } else {
            delete currentFilter[name];
        }
        setFilter(currentFilter);
        setPaginationCursor(null);
        setSeed(Math.random());
    };

    // receiverData initialises undefined, update when no longer null
    useEffect(() => {
        if (receiverData !== null)
            setFilter({ transport: get(receiverData, 'transport') });
    }, [receiverData]);

    const connect = (senderID, receiverID, endpoint) => {
        makeConnection(senderID, receiverID, endpoint, props).then(() => {
            refresh();
            props.history.push(
                `${props.basePath}/${props.id}/show/${endpoint}`
            );
        });
    };

    if (!loaded) return <Loading />;
    if (error) return <Error />;
    if (!data) return null;

    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<ReceiversTitle />}
            actions={<Fragment />}
        >
            <SimpleShowLayout>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                style={{
                                    paddingLeft: '32px',
                                }}
                            >
                                Label{' '}
                                <FilterField
                                    name="label"
                                    setFilter={changeFilter}
                                />
                            </TableCell>
                            <TableCell>
                                ID{' '}
                                <FilterField
                                    name="id"
                                    setFilter={changeFilter}
                                />
                            </TableCell>
                            <TableCell>Flow</TableCell>
                            <TableCell>Device</TableCell>
                            {QueryVersion() >= 'v1.2' && (
                                <TableCell>Active</TableCell>
                            )}
                            <TableCell>Connect</TableCell>
                        </TableRow>
                    </TableHead>
                    {data && (
                        <TableBody>
                            {data.map(item => (
                                <TableRow
                                    key={item.id}
                                    selected={
                                        get(receiverData, 'id') === item.id
                                    }
                                >
                                    <TableCell component="th" scope="row">
                                        <ShowButton
                                            style={{
                                                textTransform: 'none',
                                            }}
                                            basePath="/senders"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.id}</TableCell>
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
                                            basePath="/devices"
                                            label="Device"
                                            source="device_id"
                                            reference="devices"
                                            link="show"
                                        >
                                            <ChipConditionalLabel source="label" />
                                        </ReferenceField>
                                    </TableCell>
                                    {QueryVersion() >= 'v1.2' && (
                                        <TableCell>
                                            {item.subscription.active ? (
                                                <CheckIcon />
                                            ) : (
                                                <ClearIcon />
                                            )}
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
                    )}
                </Table>
                <Table>
                    <TableFooter>
                        <TableRow>
                            <TableCell style={{ whiteSpace: 'nowrap' }}>
                                <PaginationButton
                                    label="FIRST"
                                    nextPage={nextPage}
                                />
                                <PaginationButton
                                    label="PREV"
                                    nextPage={nextPage}
                                />
                                <PaginationButton
                                    label="NEXT"
                                    nextPage={nextPage}
                                />
                                <PaginationButton
                                    label="LAST"
                                    nextPage={nextPage}
                                />
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default ReceiversShow;
