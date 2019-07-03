import React from 'react';
import {
    Title,
    TextField,
    FunctionField,
    TextInput,
    Edit,
    ListButton,
    SimpleForm,
    DisabledInput,
    SimpleShowLayout,
    UrlField,
    ShowButton,
    Show,
} from 'react-admin';
import { hr } from '@material-ui/core';
import {
    CardActions,
    Card,
    CardContent,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@material-ui/core';
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import MapTags from '../components/TagsField';

const EventsTitle = ({ record }) => {
    return <span>Log: {record ? `${record.timestamp}` : ''}</span>;
};
const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

const EventsShowActions = ({ basePath }) => (
    <CardActions title={<EventsTitle />} style={cardActionStyle}>
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </CardActions>
);

export class EventsList extends React.Component {
    constructor(props) {
        super(props);
        this.filter = '';
        this.filterObject = {};
        this.state = {
            data: [],
        };
        this.nextPage = this.nextPage.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.filterPage = this.filterPage.bind(this);
        this.firstLoad = this.firstLoad.bind(this);
        this.firstLoad();
    }

    async firstLoad() {
        var params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'timestamp', order: 'DESC' },
        };
        var dataObject = await dataProvider('GET_LIST', 'events', params);
        this.setState({ data: dataObject });
    }

    async nextPage(label) {
        var dataObject = await dataProvider(label, 'events');
        this.setState({ data: dataObject });
    }

    setFilter(filterValue, name) {
        if (filterValue) {
            this.filterObject[name] = filterValue;
        } else {
            delete this.filterObject[name];
        }
        this.filterPage();
    }

    async filterPage() {
        var params = {
            filter: this.filterObject,
        };
        var dataObject = await dataProvider('GET_LIST', 'events', params);
        this.setState({ data: dataObject });
    }

    render() {
        if (this.state.data.data) {
            return (
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
                                            setFilter={this.setFilter}
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
                                            setFilter={this.setFilter}
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
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    <TableCell style={{ paddingRight: '6px' }}>
                                        Request uri{' '}
                                        <FilterField
                                            name="request_uri"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            minWidth: '263px',
                                            paddingRight: '6px',
                                        }}
                                    >
                                        Http method{' '}
                                        <FilterField
                                            width="20px"
                                            name="http_method"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {this.state.data.data.map(item => (
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
                                        <TableCell align="right">
                                            {item.level}
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.message}
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.request_uri}
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.http_method}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <PaginationButton
                            label="FIRST"
                            nextPage={this.nextPage}
                        />
                        <PaginationButton
                            label="PREV"
                            nextPage={this.nextPage}
                        />
                        <PaginationButton
                            label="NEXT"
                            nextPage={this.nextPage}
                        />
                        <PaginationButton
                            label="LAST"
                            nextPage={this.nextPage}
                        />
                    </CardContent>
                </Card>
            );
        } else {
            return <div></div>;
        }
    }
}

export const EventsShow = props => (
    <Show title={<EventsTitle />} actions={<EventsShowActions />} {...props}>
        <SimpleShowLayout>
            <TextField source="timestamp" />
            <TextField source="level" />
            <TextField source="level_name" />
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
            <TextField source="http_method" />
            <UrlField source="request_uri" />
            <hr />
            <TextField source="source_location.file" label="Source file" />
            <TextField source="source_location.line" label="Source line" />
            <TextField
                source="source_location.function"
                label="Source function"
            />
            <hr />
            <TextField source="thread_id" />
            <TextField source="id" />
        </SimpleShowLayout>
    </Show>
);

export const EventsEdit = props => (
    <Edit title={<EventsTitle />} {...props}>
        <SimpleForm>
            <DisabledInput source="timestamp" />
            <TextInput source="level" />
            <TextInput source="level_name" />
            <TextInput source="thread_id" />
            <TextInput source="source_location.file" />
            <TextInput source="source_location.line" />
            <TextInput source="source_location.line" />
            <TextInput source="source_location.function" />
            <TextInput source="message" />
            <DisabledInput source="http_method" />
            <TextInput source="id" />
            <TextInput source="cursor" />
        </SimpleForm>
    </Edit>
);
