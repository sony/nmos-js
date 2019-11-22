import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import {
    BooleanField,
    Error,
    Loading,
    ShowButton,
    Title,
    useQuery,
} from 'react-admin';
import FilterField from '../../components/FilterField';
import PaginationButton from '../../components/PaginationButton';
import ListActions from '../../components/ListActions';

const SubscriptionsList = props => {
    const [type, setType] = useState('getList');
    const [params, setParams] = useState({
        filter: {},
    });

    const { data, loaded, error } = useQuery({
        type: type,
        resource: 'subscriptions',
        payload: type === 'getList' ? params : {},
    });

    const nextPage = label => {
        setType(label);
    };

    const changeFilter = (filterValue, name) => {
        let filter = params.filter;
        if (filterValue) {
            filter[name] = filterValue;
        } else {
            delete filter[name];
        }
        setType('getList');
        setParams({ filter: filter });
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
                <Title title={'Subscriptions'} />
                <CardContent>
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
                            {data.map(item => (
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
                </CardContent>
            </Card>
        </>
    );
};

export default SubscriptionsList;
