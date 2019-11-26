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
import { BooleanField, Error, Loading, ShowButton, Title } from 'react-admin';
import FilterField from '../../components/FilterField';
import PaginationButton from '../../components/PaginationButton';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

const SubscriptionsList = props => {
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
