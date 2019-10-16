import React from 'react';
import {
    BooleanField,
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
import UrlField from '../components/URLField';
import MapTags from '../components/TagsField';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

export class SubscriptionsList extends React.Component {
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
        const params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'timestamp', order: 'DESC' },
        };
        const dataObject = await dataProvider(
            'GET_LIST',
            'subscriptions',
            params
        );
        this.setState({ data: dataObject });
    }

    async nextPage(label) {
        const dataObject = await dataProvider(label, 'subscriptions');
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
        const params = {
            filter: this.filterObject,
        };
        const dataObject = await dataProvider(
            'GET_LIST',
            'subscriptions',
            params
        );
        this.setState({ data: dataObject });
    }

    render() {
        if (this.state.data.data) {
            return (
                <Card>
                    <Title title={'Subscriptions'} />
                    <CardContent>
                        <Button
                            label={'Raw'}
                            href={this.state.data.url}
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
                                            minWidth: '280px',
                                            paddingLeft: '32px',
                                        }}
                                    >
                                        Resource Path{' '}
                                        <FilterField
                                            name="resource path"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    <TableCell style={{ minWidth: '255px' }}>
                                        Persist{' '}
                                        <FilterField
                                            name="persist"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    <TableCell style={{ minWidth: '290px' }}>
                                        Max Update Rate{' '}
                                        <FilterField
                                            name="max update rate"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    <TableCell style={{ minWidth: '255px' }}>
                                        ID{' '}
                                        <FilterField
                                            name="id"
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
                                                basePath="/subscriptions"
                                                record={item}
                                                label={item.resource_path}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <BooleanField
                                                record={item}
                                                source="persist"
                                            />
                                        </TableCell>
                                        <TableCell label="Max Update Rate (ms)">
                                            {item.max_update_rate_ms}
                                        </TableCell>
                                        <TableCell>{item.id}</TableCell>
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
            return <div />;
        }
    }
}

const SubscriptionsTitle = ({ record }) => {
    return (
        <span>
            Subscription:{' '}
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

const SubscriptionsShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<SubscriptionsTitle />} style={cardActionStyle}>
        {data ? (
            <Button
                label={'Raw'}
                href={cookies.get('Query API') + '/' + resource + '/' + data.id}
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton basePath={basePath} />
    </CardActions>
);

export const SubscriptionsShow = props => (
    <Show
        title={<SubscriptionsTitle />}
        actions={<SubscriptionsShowActions />}
        {...props}
    >
        <SimpleShowLayout>
            <TextField source="id" label="ID" />
            <TextField source="resource_path" />
            <UrlField label="WebSocket Address" source="ws_href" />
            <TextField
                label="Max Update Rate (ms)"
                source="max_update_rate_ms"
            />
            <FunctionField
                label="Params"
                render={record =>
                    Object.keys(record.params).length > 0
                        ? MapTags(record)
                        : null
                }
            />
            <hr />
            <BooleanField source="persist" />
            <BooleanField source="secure" />
        </SimpleShowLayout>
    </Show>
);
