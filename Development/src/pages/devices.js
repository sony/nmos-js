import React, { useState } from 'react';
import {
    ArrayField,
    Button,
    ChipField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceArrayField,
    ReferenceField,
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
import '../index.css';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

export const DevicesList = () => {
    const firstLoad = async () => {
        const params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'id', order: 'DESC' },
        };
        const dataObject = await dataProvider('GET_LIST', 'devices', params);
        setData(dataObject);
    };

    const [data, setData] = useState(firstLoad);

    const nextPage = async label => {
        const dataObject = await dataProvider(label, 'devices');
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
        const filteredDataObject = await dataProvider('GET_LIST', 'devices', {
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
                <Title title={'Devices'} />
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
                                <TableCell style={{ minWidth: '240px' }}>
                                    Type{' '}
                                    <FilterField
                                        name="type"
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
                                            basePath="/devices"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.type}</TableCell>
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
        return <div />;
    }
};

const DevicesTitle = ({ record }) => {
    return (
        <span>
            Device:{' '}
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

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
};

const DevicesShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<DevicesTitle />} style={cardActionStyle}>
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

export const DevicesShow = props => (
    <ShowController {...props}>
        {controllerProps => (
            <ShowView
                {...props}
                {...controllerProps}
                title={<DevicesTitle />}
                actions={<DevicesShowActions />}
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
                    <TextField source="type" />
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <ArrayField source="controls">
                            <Datagrid>
                                <UrlField source="href" label="Address" />
                                <TextField source="type" />
                            </Datagrid>
                        </ArrayField>
                    )}
                    <ReferenceField
                        label="Node"
                        source="node_id"
                        reference="nodes"
                        linkType="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                    <ReferenceArrayField
                        allowEmpty={true}
                        source="receivers"
                        reference="receivers"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    <ReferenceArrayField
                        allowEmpty={true}
                        clickable="true"
                        source="senders"
                        reference="senders"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    <hr />
                    <ReferenceManyField
                        clickable="true"
                        label="Receivers"
                        target="device_id"
                        reference="receivers"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                    <ReferenceManyField
                        clickable="true"
                        label="Senders"
                        target="device_id"
                        reference="senders"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                    <ReferenceManyField
                        clickable="true"
                        label="Sources"
                        reference="sources"
                        target="device_id"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                    <ReferenceManyField
                        clickable="true"
                        label="Flows"
                        reference="flows"
                        target="device_id"
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
