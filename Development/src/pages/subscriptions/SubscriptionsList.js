import React, { Fragment, useState } from 'react';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { BooleanField, Loading, ShowButton, Title } from 'react-admin';
import FilterPanel, { StringFilter } from '../../components/FilterPanel';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

const SubscriptionsList = props => {
    const [filter, setFilter] = useState({});
    const [paginationURL, setPaginationURL] = useState(null);
    const { data, loaded, pagination, url } = useGetList({
        ...props,
        filter,
        paginationURL,
    });
    if (!loaded) return <Loading />;

    const nextPage = label => {
        setPaginationURL(pagination[label]);
    };

    return (
        <Fragment>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions url={url} />
            </div>
            <Card>
                <Title title={'Subscriptions'} />
                <CardContent>
                    <FilterPanel
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                    >
                        <StringFilter
                            source="resource_path"
                            label="Resource Path"
                        />
                        <StringFilter source="persist" />
                        <StringFilter
                            source="max_update_rate_ms"
                            label="Max Update Rate"
                        />
                        <StringFilter source="id" label="ID" />
                    </FilterPanel>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Resource Path
                                </TableCell>
                                <TableCell>Persist</TableCell>
                                <TableCell>Max Update Rate</TableCell>
                                <TableCell>ID</TableCell>
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
                    <PaginationButtons
                        disabled={!pagination}
                        nextPage={nextPage}
                        {...props}
                    />
                </CardContent>
            </Card>
        </Fragment>
    );
};

export default SubscriptionsList;
