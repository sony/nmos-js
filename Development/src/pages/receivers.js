import React, { useEffect, useState } from 'react';
import { Link, Route } from 'react-router-dom';
import {
    ArrayField,
    BooleanField,
    BooleanInput,
    Button,
    ChipField,
    Edit,
    FormDataConsumer,
    FunctionField,
    LongTextInput,
    ReferenceField,
    SaveButton,
    SelectInput,
    ShowButton,
    ShowController,
    ShowView,
    SimpleForm,
    SimpleShowLayout,
    TextField,
    TextInput,
    Title,
    Toolbar,
    withDataProvider,
} from 'react-admin';
import get from 'lodash/get';
import set from 'lodash/set';
import Cookies from 'universal-cookie';
import {
    AppBar,
    Card,
    CardContent,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableRow,
    Tabs,
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import TAIField from '../components/TAIField';
import MapTags from '../components/TagsField';
import JsonIcon from '../components/JsonIcon';
import ReceiverTransportParamsCardsGrid from '../components/ReceiverTransportParams';
import ConnectionShowActions from '../components/ConnectionShowActions';
import ConnectionEditActions from '../components/ConnectionEditActions';
import JSONViewer from '../components/JSONViewer';
import TransportFileViewer from '../components/TransportFileViewer';
import ItemArrayField from '../components/ItemArrayField';
import MakeConnection from '../components/MakeConnection';

const cookies = new Cookies();

export const ReceiversList = () => {
    const firstLoad = async () => {
        const params = {
            filter: {},
        };
        const dataObject = await dataProvider('GET_LIST', 'receivers', params);
        setData(dataObject);
    };

    const [data, setData] = useState(firstLoad);

    const nextPage = async label => {
        const dataObject = await dataProvider(label, 'receivers');
        setData(dataObject);
    };

    const [filterState, setFilterState] = useState({});

    const changeFilter = async (filterValue, name) => {
        let filter = filterState;
        if (filterValue) {
            filter[name] = filterValue;
        } else {
            delete filter[name];
        }
        const filteredDataObject = await dataProvider('GET_LIST', 'receivers', {
            filter: filter,
        });
        setFilterState(filter);
        setData(filteredDataObject);
    };

    const clearFilter = async () => {
        setData(firstLoad());
        setFilterState({});
    };

    if (data.hasOwnProperty('data')) {
        return (
            <Card>
                <Title title={'Receivers'} />
                <CardContent>
                    <Button
                        label={'Raw'}
                        href={data.url}
                        style={{ float: 'right' }}
                        title={'View raw'}
                    >
                        <JsonIcon />
                    </Button>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        minWidth: '240px',
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Label{' '}
                                    <FilterField
                                        name="label"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell style={{ minWidth: '245px' }}>
                                    Format{' '}
                                    <FilterField
                                        name="format"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell style={{ minWidth: '260px' }}>
                                    Transport{' '}
                                    <FilterField
                                        name="transport"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                {QueryVersion() >= 'v1.2' && (
                                    <TableCell>Active</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.data.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell component="th" scope="row">
                                        <ShowButton
                                            style={{
                                                textTransform: 'none',
                                            }}
                                            basePath="/receivers"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.format}</TableCell>
                                    <TableCell>{item.transport}</TableCell>
                                    {QueryVersion() >= 'v1.2' && (
                                        <TableCell>
                                            {item.subscription.active ? (
                                                <CheckIcon />
                                            ) : (
                                                <ClearIcon />
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <br />
                    <PaginationButton label="FIRST" nextPage={nextPage} />
                    <PaginationButton label="PREV" nextPage={nextPage} />
                    <PaginationButton label="NEXT" nextPage={nextPage} />
                    <PaginationButton label="LAST" nextPage={nextPage} />
                    <Button
                        onClick={() => clearFilter()}
                        label="Clear All Filters"
                    />
                </CardContent>
            </Card>
        );
    } else {
        return <div />;
    }
};

const ReceiversTitle = ({ record }) => {
    return (
        <span>
            Receiver:{' '}
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

const ChipConditionalLabel = ({ record, source, ...props }) => {
    props.clickable = true;
    return record ? (
        record[source] ? (
            <ChipField {...{ record, source, ...props }} />
        ) : (
            <ChipField {...{ record, source: 'id', ...props }} />
        )
    ) : null;
};

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
};

const ReceiversShowComponent = props => {
    return (
        <ShowController {...props}>
            {controllerProps => (
                <div>
                    <AppBar position="static" color="default">
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
                                disabled={
                                    !get(controllerProps.record, '$active')
                                }
                            />
                        </Tabs>
                    </AppBar>
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
                </div>
            )}
        </ShowController>
    );
};

const ShowSummaryTab = ({ controllerProps, ...props }) => {
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<ReceiversTitle />}
            actions={<ConnectionShowActions />}
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
                            label="Caps Media Types"
                            source="caps.media_types"
                        />
                    )}
                {controllerProps.record &&
                    controllerProps.record.caps.event_types && (
                        <ItemArrayField
                            label="Caps Event Types"
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
                            linkType="show"
                        >
                            <ChipConditionalLabel source="label" />
                        </ReferenceField>
                    )}
                <hr />
                <ReferenceField
                    label="Device"
                    source="device_id"
                    reference="devices"
                    linkType="show"
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
            actions={<ConnectionShowActions />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(controllerProps.record, '$active.sender_id') && (
                    <ReferenceField
                        basePath="/senders"
                        label="Sender"
                        source="$active.sender_id"
                        reference="senders"
                        linkType="show"
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
            actions={<ConnectionShowActions />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                {get(controllerProps.record, '$staged.sender_id') && (
                    <ReferenceField
                        basePath="/senders"
                        label="Sender"
                        source="$staged.sender_id"
                        reference="senders"
                        linkType="show"
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

const PostEditToolbar = props => (
    <Toolbar {...props}>
        <SaveButton label="Stage" />
    </Toolbar>
);

export const ReceiversEdit = props => {
    return (
        <div>
            <AppBar position="static" color="default">
                <Tabs
                    value={props.location.pathname}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab
                        label="Summary"
                        component={Link}
                        to={`${props.basePath}/${props.id}/show/`}
                    />
                    <Tab
                        label="Active"
                        component={Link}
                        to={`${props.basePath}/${props.id}/show/active`}
                    />
                    <Tab
                        label="Staged"
                        value={`${props.match.url}`}
                        component={Link}
                        to={`${props.basePath}/${props.id}/show/staged`}
                    />
                    <Tab
                        label="Connect"
                        component={Link}
                        to={`${props.basePath}/${props.id}/show/connect`}
                    />
                </Tabs>
            </AppBar>
            <Route
                exact
                path={`${props.basePath}/${props.id}/`}
                render={() => <EditStagedTab {...props} />}
            />
        </div>
    );
};

const EditStagedTab = props => (
    <Edit
        {...props}
        undoable={false}
        title={<ReceiversTitle />}
        actions={<ConnectionEditActions id={props.id} />}
    >
        <SimpleForm
            toolbar={<PostEditToolbar />}
            redirect={`/receivers/${props.id}/show/staged`}
        >
            <TextInput label="Sender ID" source="$staged.sender_id" />
            <BooleanInput
                label="Master Enable"
                source="$staged.master_enable"
            />
            <SelectInput
                label="Activation Mode"
                source="$staged.activation.mode"
                choices={[
                    { id: null, name: <ClearIcon /> },
                    {
                        id: 'activate_immediate',
                        name: 'activate_immediate',
                    },
                    {
                        id: 'activate_scheduled_relative',
                        name: 'activate_scheduled_relative',
                    },
                    {
                        id: 'activate_scheduled_absolute',
                        name: 'activate_scheduled_absolute',
                    },
                ]}
            />
            <FormDataConsumer>
                {({ formData, ...rest }) => {
                    switch (get(formData, '$staged.activation.mode')) {
                        case 'activate_scheduled_relative':
                            return (
                                <TextInput
                                    label="Requested Time"
                                    source="$staged.activation.requested_time"
                                    {...rest}
                                />
                            );
                        case 'activate_scheduled_absolute':
                            return (
                                <TextInput
                                    label="Requested Time"
                                    source="$staged.activation.requested_time"
                                    {...rest}
                                />
                            );
                        default:
                            set(
                                formData,
                                '$staged.activation.requested_time',
                                null
                            );
                            return null;
                    }
                }}
            </FormDataConsumer>
            <ReceiverTransportParamsCardsGrid />
            <LongTextInput
                label="Transport File"
                source="$staged.transport_file.data"
                resettable
            />
        </SimpleForm>
    </Edit>
);

const ConnectionManagementTab = ({
    controllerProps,
    receiverData,
    ...props
}) => {
    const [sendersListData, setSendersListData] = useState(undefined);
    const [params, setParams] = useState({
        filter: { transport: get(receiverData, 'transport') },
    });

    useEffect(() => {
        (async function fetchData() {
            const data = await dataProvider('GET_LIST', 'senders', params);
            setSendersListData(data);
        })();
    }, [params]);

    const changeFilter = (filterValue, name) => {
        let newFilter = params.filter;
        if (filterValue) {
            newFilter[name] = filterValue;
        } else {
            delete newFilter[name];
        }
        setParams({ filter: newFilter });
    };

    const nextPage = async label => {
        const data = await dataProvider(label, 'senders');
        setSendersListData(data);
    };

    // receiverData initialises undefined, update when no longer null
    useEffect(() => {
        if (receiverData !== null)
            setParams({
                filter: { transport: get(receiverData, 'transport') },
            });
    }, [receiverData]);

    const connect = (senderID, receiverID, endpoint) => {
        MakeConnection(senderID, receiverID, endpoint, props).then(() =>
            props.history.push(`${props.basePath}/${props.id}/show/${endpoint}`)
        );
    };

    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<ReceiversTitle />}
            actions={<div />}
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
                                <TableCell>Subscription Active</TableCell>
                            )}
                            <TableCell>Connect</TableCell>
                        </TableRow>
                    </TableHead>
                    {sendersListData && (
                        <TableBody>
                            {sendersListData.data.map(item => (
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
                                            linkType="show"
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
                                            linkType="show"
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
                                            label="Activate"
                                        />
                                        <Button
                                            onClick={() =>
                                                connect(
                                                    item.id,
                                                    get(receiverData, 'id'),
                                                    'staged'
                                                )
                                            }
                                            label="Stage"
                                        />
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

const ReceiversShow = withDataProvider(ReceiversShowComponent);
export { ReceiversShow };
