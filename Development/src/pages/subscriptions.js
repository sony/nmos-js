import React, { useState } from 'react';
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

export const SubscriptionsList = () => {
    const firstLoad = async () => {
        const params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'id', order: 'DESC' },
        };
        const dataObject = await dataProvider(
            'GET_LIST',
            'subscriptions',
            params
        );
        setData(dataObject);
    };

    const [data, setData] = useState(firstLoad);

    const nextPage = async label => {
        const dataObject = await dataProvider(label, 'subscriptions');
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
        const filteredDataObject = await dataProvider(
            'GET_LIST',
            'subscriptions',
            {
                filter: filter,
            }
        );
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
                <Title title={'Subscriptions'} />
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
                                        minWidth: '280px',
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Resource Path{' '}
                                    <FilterField
                                        name="resource path"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell style={{ minWidth: '255px' }}>
                                    Persist{' '}
                                    <FilterField
                                        name="persist"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell style={{ minWidth: '290px' }}>
                                    Max Update Rate{' '}
                                    <FilterField
                                        name="max update rate"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell style={{ minWidth: '255px' }}>
                                    ID{' '}
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
