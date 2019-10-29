import React, { useState } from 'react';
import {
    Button,
    FunctionField,
    ListButton,
    Show,
    ShowButton,
    SimpleShowLayout,
    TextField,
    Title,
} from 'react-admin';
import { hr } from '@material-ui/core';
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
import MapTags from '../components/TagsField';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

const EventsTitle = ({ record }) => {
    return <span>Log: {record ? `${record.timestamp}` : ''}</span>;
};
const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

export const EventsList = () => {
    const firstLoad = async () => {
        const params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'id', order: 'DESC' },
        };
        const dataObject = await dataProvider('GET_LIST', 'events', params);
        setData(dataObject);
    };

    const [data, setData] = useState(firstLoad);

    const nextPage = async label => {
        const dataObject = await dataProvider(label, 'events');
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
        const filteredDataObject = await dataProvider('GET_LIST', 'events', {
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
                <Title title={'Logs'} />
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
                                        minWidth: '257px',
                                        paddingRight: '6px',
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Timestamp{' '}
                                    <FilterField
                                        name="timestamp"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell
                                    style={{
                                        minWidth: '227px',
                                        paddingRight: '6px',
                                    }}
                                >
                                    Level{' '}
                                    <FilterField
                                        name="level"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell
                                    style={{
                                        minWidth: '247px',
                                        paddingRight: '6px',
                                    }}
                                >
                                    Message{' '}
                                    <FilterField
                                        name="message"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell style={{ paddingRight: '6px' }}>
                                    Request URI{' '}
                                    <FilterField
                                        name="request_uri"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell
                                    style={{
                                        minWidth: '263px',
                                        paddingRight: '6px',
                                    }}
                                >
                                    HTTP Method{' '}
                                    <FilterField
                                        width="20px"
                                        name="http_method"
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
                                            basePath="/events"
                                            record={item}
                                            label={item.timestamp}
                                        />
                                    </TableCell>
                                    <TableCell>{item.level}</TableCell>
                                    <TableCell>{item.message}</TableCell>
                                    <TableCell>{item.request_uri}</TableCell>
                                    <TableCell>{item.http_method}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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

const EventsShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<EventsTitle />} style={cardActionStyle}>
        {data ? (
            <Button
                label={'Raw'}
                href={
                    cookies.get('Logging API') + '/' + resource + '/' + data.id
                }
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </CardActions>
);

export const EventsShow = props => (
    <Show title={<EventsTitle />} actions={<EventsShowActions />} {...props}>
        <SimpleShowLayout>
            <TextField source="timestamp" />
            <TextField source="level" />
            <TextField source="level_name" label="Level Name" />
            <TextField source="message" />
            <FunctionField
                label="Tags"
                render={record =>
                    record.tags
                        ? Object.keys(record.tags).length > 0
                            ? MapTags(record)
                            : null
                        : null
                }
            />
            <TextField source="http_method" label="HTTP Method" />
            <TextField source="request_uri" label="Request URI" />
            <hr />
            <TextField source="source_location.file" label="Source File" />
            <TextField source="source_location.line" label="Source Line" />
            <TextField
                source="source_location.function"
                label="Source Function"
            />
            <hr />
            <TextField source="thread_id" label="Thread ID" />
            <TextField source="id" label="ID" />
        </SimpleShowLayout>
    </Show>
);
