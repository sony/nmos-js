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
import { BooleanField, Loading, ShowButton, Title } from 'react-admin';
import get from 'lodash/get';
import DeleteButton from '../../components/DeleteButton';
import FilterPanel, {
    BooleanFilter,
    NumberFilter,
    StringFilter,
} from '../../components/FilterPanel';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';
import { useJSONSetting } from '../../settings';

const SubscriptionsList = props => {
    const [filter, setFilter] = useJSONSetting('Subscriptions Filter');
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
        <>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions url={url} {...props} />
            </div>
            <Card>
                <Title title={'Subscriptions'} />
                <CardContent>
                    <FilterPanel filter={filter} setFilter={setFilter}>
                        <StringFilter source="resource_path" />
                        <BooleanFilter source="persist" />
                        <NumberFilter source="max_update_rate_ms" />
                        <StringFilter source="id" />
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
                                <TableCell>Max Update Rate (ms)</TableCell>
                                <TableCell />
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
                                    <TableCell>
                                        {item.max_update_rate_ms}
                                    </TableCell>
                                    <TableCell>
                                        {get(item, 'persist') && (
                                            <DeleteButton
                                                resource="subscriptions"
                                                id={item.id}
                                                variant="text"
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <PaginationButtons
                        pagination={pagination}
                        nextPage={nextPage}
                        {...props}
                    />
                </CardContent>
            </Card>
        </>
    );
};

export default SubscriptionsList;
