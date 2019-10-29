import React, { useState } from 'react';
import {
    ArrayField,
    Button,
    ChipField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceManyField,
    ShowButton,
    ShowController,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    Title,
} from 'react-admin';
import {
    Card,
    CardActions,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';

import Cookies from 'universal-cookie';
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import TAIField from '../components/TAIField';
import UrlField from '../components/URLField';
import MapTags from '../components/TagsField';
import ExternalLinkIcon from '@material-ui/icons/OpenInNew';
import JsonIcon from '../components/JsonIcon';
import ItemArrayField from '../components/ItemArrayField';

const cookies = new Cookies();

export const NodesList = () => {
    const firstLoad = async () => {
        const params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'id', order: 'DESC' },
        };
        const dataObject = await dataProvider('GET_LIST', 'nodes', params);
        setData(dataObject);
    };

    const [data, setData] = useState(firstLoad);

    const nextPage = async label => {
        const dataObject = await dataProvider(label, 'nodes');
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
        const filteredDataObject = await dataProvider('GET_LIST', 'nodes', {
            filter: filter,
        });
        setFilterState(filter);
        setData(filteredDataObject);
    };

    const clearFilter = async () => {
        setData(firstLoad());
        setFilterState({});
    };

    const copyField = data => {
        const el = document.createElement('textarea');
        el.value = data;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    };

    if (data.hasOwnProperty('data')) {
        return (
            <Card>
                <Title title={'Nodes'} />
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
                                <TableCell style={{ minWidth: '265px' }}>
                                    Hostname{' '}
                                    <FilterField
                                        name="hostname"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                {QueryVersion() >= 'v1.1' && (
                                    <TableCell style={{ minWidth: '280px' }}>
                                        API Versions{' '}
                                        <FilterField
                                            name="api.versions"
                                            setFilter={changeFilter}
                                        />
                                    </TableCell>
                                )}
                                <TableCell style={{ minWidth: '255px' }}>
                                    Node ID{' '}
                                    <FilterField
                                        name="id"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
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
                                            basePath="/nodes"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.hostname}</TableCell>
                                    {QueryVersion() >= 'v1.1' && (
                                        <TableCell>
                                            {item.api.versions.join(', ')}
                                        </TableCell>
                                    )}
                                    <TableCell
                                        onDoubleClick={() => copyField(item.id)}
                                    >
                                        {item.id}
                                    </TableCell>
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
                        label="Clear Filters"
                    />
                </CardContent>
            </Card>
        );
    } else {
        return (
            <div>
                <p>Waiting for data...</p>
            </div>
        );
    }
};

const NodesTitle = ({ record }) => {
    return (
        <span>
            Node:{' '}
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

const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

function buildLink(record) {
    return record.protocol + '://' + record.host + ':' + record.port;
}

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
};

const NodesShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<NodesTitle />} style={cardActionStyle}>
        {data ? (
            <Button
                label={'Raw'}
                href={cookies.get('Query API') + '/' + resource + '/' + data.id}
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </CardActions>
);

export const NodesShow = props => (
    <ShowController {...props}>
        {controllerProps => (
            <ShowView
                {...props}
                {...controllerProps}
                title={<NodesTitle />}
                actions={<NodesShowActions />}
            >
                <SimpleShowLayout>
                    <TextField label="ID" source="id" />
                    <TAIField source="version" />
                    <TextField source="label" />
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <TextField source="description" />
                    )}
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <FunctionField
                            label="Tags"
                            render={record =>
                                Object.keys(record.tags).length > 0
                                    ? MapTags(record)
                                    : null
                            }
                        />
                    )}
                    <hr />
                    <UrlField source="href" label="Address" />
                    <TextField source="hostname" />
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <ItemArrayField
                            label="API Versions"
                            source="api.versions"
                        />
                    )}
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <ArrayField
                            label=" API Endpoints"
                            source="api.endpoints"
                        >
                            <Datagrid>
                                <TextField source="host" />
                                <TextField source="port" />
                                <TextField source="protocol" />
                                <FunctionField
                                    render={record => (
                                        <a
                                            href={buildLink(record)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLinkIcon
                                                style={{
                                                    color: '#2196f3',
                                                    preserveAspectRatio:
                                                        'xMidYMin',
                                                }}
                                            />
                                        </a>
                                    )}
                                />
                            </Datagrid>
                        </ArrayField>
                    )}
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <ArrayField source="clocks">
                            <Datagrid>
                                <TextField source="name" />
                                <TextField label="Ref Type" source="ref_type" />
                            </Datagrid>
                        </ArrayField>
                    )}
                    <ArrayField source="services">
                        <Datagrid>
                            <UrlField source="href" label="Address" />
                            <TextField source="type" />
                        </Datagrid>
                    </ArrayField>
                    {controllerProps.record && QueryVersion() >= 'v1.2' && (
                        <ArrayField source="interfaces">
                            <Datagrid>
                                <TextField
                                    source="chassis_id"
                                    label="Chassis ID"
                                />
                                <TextField source="name" />
                                <TextField source="port_id" label="Port ID" />
                            </Datagrid>
                        </ArrayField>
                    )}
                    <hr />
                    <ReferenceManyField
                        label="Devices"
                        reference="devices"
                        target="node_id"
                        foo="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                </SimpleShowLayout>
            </ShowView>
        )}
    </ShowController>
);
