import React, { Fragment, useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { Loading, ShowButton, Title } from 'react-admin';
import ActiveField from '../../components/ActiveField';
import PaginationButtons from '../../components/PaginationButtons';
import QueryVersion from '../../components/QueryVersion';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

import FilterPanel, {
    BooleanFilter,
    StringFilter,
} from '../../components/FilterPanel';

const ReceiversList = props => {
    const [filter, setFilter] = useState({});
    const [paginationURL, setPaginationURL] = useState(null);
    const { data, loaded, pagination, url } = useGetList({
        ...props,
        filter,
        paginationURL,
    });
    useEffect(() => {
        setPaginationURL(null);
    }, [filter]);

    const nextPage = label => {
        setPaginationURL(pagination[label]);
    };
    if (!loaded) return <Loading />;

    return (
        <Fragment>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions url={url} />
            </div>
            <Card>
                <Title title={'Receivers'} />
                <CardContent>
                    <FilterPanel
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                    >
                        <StringFilter source="label" />
                        <StringFilter source="format" />
                        <StringFilter source="transport" />
                        {QueryVersion() >= 'v1.2' && (
                            <BooleanFilter
                                source="subscription.active"
                                label="Active"
                            />
                        )}
                    </FilterPanel>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Label
                                </TableCell>
                                <TableCell>Format</TableCell>
                                <TableCell>Transport</TableCell>
                                {QueryVersion() >= 'v1.2' && (
                                    <TableCell>Active</TableCell>
                                )}
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
                                            basePath="/receivers"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.format}</TableCell>
                                    <TableCell>{item.transport}</TableCell>
                                    {QueryVersion() >= 'v1.2' && (
                                        <TableCell>
                                            <ActiveField
                                                record={item}
                                                resource="receivers"
                                            />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <br />
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

export default ReceiversList;
