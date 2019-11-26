import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    hr,
} from '@material-ui/core';
import {
    Button,
    FunctionField,
    ListButton,
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
} from 'react-admin';
import { Error, Loading, ShowButton, Title } from 'react-admin';
import Cookies from 'universal-cookie';
import FilterField from '../components/FilterField';
import PaginationButton from '../components/PaginationButton';
import MapTags from '../components/TagsField';
import ListActions from '../components/ListActions';
import JsonIcon from '../components/JsonIcon';
import useGetList from '../components/useGetList';

const cookies = new Cookies();

const EventsTitle = ({ record }) => {
    return <span>Log: {record ? `${record.timestamp}` : ''}</span>;
};

export const EventsList = props => {
    const [filter, setFilter] = useState({});
    const [paginationCursor, setPaginationCursor] = useState(null);
    // As the paginationCursor variable has not changed we need to force an update
    const [seed, setSeed] = useState(Math.random());

    const { data, error, loaded } = useGetList({
        ...props,
        filter,
        paginationCursor,
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

    if (!loaded) return <Loading />;
    if (error) return <Error />;
    if (!data) return null;

    return (
        <>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions {...props} />
            </div>
            <Card>
                <Title title={'Logs'} />
                <CardContent>
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
                                        minWidth: '100px',
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
                                        minWidth: '150px',
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
                            {data.map(item => (
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
                </CardContent>
            </Card>
        </>
    );
};

const EventsShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<EventsTitle />}>
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
    </TopToolbar>
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
