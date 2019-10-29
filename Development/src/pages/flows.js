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
import Cookies from 'universal-cookie';
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
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import TAIField from '../components/TAIField';
import MapTags from '../components/TagsField';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

export const FlowsList = () => {
    const firstLoad = async () => {
        const params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'id', order: 'DESC' },
        };
        const dataObject = await dataProvider('GET_LIST', 'flows', params);
        setData(dataObject);
    };

    const [data, setData] = useState(firstLoad);

    const nextPage = async label => {
        const dataObject = await dataProvider(label, 'flows');
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
        const filteredDataObject = await dataProvider('GET_LIST', 'flows', {
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
                <Title title={'Flows'} />
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
                                            basePath="/flows"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.format}</TableCell>
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

const FlowsTitle = ({ record }) => {
    return (
        <span>
            Flow:{' '}
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

const FlowsShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<FlowsTitle />} style={cardActionStyle}>
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

export const FlowsShow = props => (
    <ShowController {...props}>
        {controllerProps => (
            <ShowView
                {...props}
                {...controllerProps}
                title={<FlowsTitle />}
                actions={<FlowsShowActions />}
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
                    <TextField source="format" />
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <TextField label="Media Type" source="media_type" />
                    )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Frame Width"
                                source="frame_width"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Frame Height"
                                source="frame_height"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Interlace Mode"
                                source="interlace_mode"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField source="colorspace" />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <ArrayField source="components">
                                <Datagrid>
                                    <TextField source="name" />
                                    <TextField source="height" />
                                    <TextField source="width" />
                                    <TextField
                                        label="Bit Depth"
                                        source="bit_depth"
                                    />
                                </Datagrid>
                            </ArrayField>
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Transfer Characteristic"
                                source="transfer_characteristic"
                            />
                        )}
                    <hr />
                    <ReferenceArrayField
                        allowEmpty={true}
                        clickable="true"
                        label="Parents"
                        source="parents"
                        reference="flows"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <ReferenceField
                            label="Device"
                            source="device_id"
                            reference="devices"
                            linkType="show"
                        >
                            <ChipConditionalLabel source="label" />
                        </ReferenceField>
                    )}
                    <ReferenceField
                        label="Source"
                        source="source_id"
                        reference="sources"
                        linkType="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                    <hr />
                    <ReferenceManyField
                        label="Senders"
                        reference="senders"
                        target="flow_id"
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
