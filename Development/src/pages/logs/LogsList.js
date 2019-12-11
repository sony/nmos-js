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
import { Loading, ShowButton, Title, useRefresh } from 'react-admin';
import FilterField from '../../components/FilterField';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

const LogsList = props => {
    const refresh = useRefresh();
    const [filter, setFilter] = useState({});
    const [paginationURL, setPaginationURL] = useState(null);
    const { data, loaded, pagination, url } = useGetList({
        ...props,
        filter,
        paginationURL,
    });
    if (!loaded) return <Loading />;
    if (!data) return null;

    const nextPage = label => {
        setPaginationURL(pagination[label]);
    };

    const changeFilter = (filterValue, name) => {
        let currentFilter = filter;
        if (filterValue) {
            currentFilter[name] = filterValue;
        } else {
            delete currentFilter[name];
        }
        setPaginationURL(null);
        setFilter(currentFilter);
        refresh();
    };

    return (
        <Fragment>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions url={url} />
            </div>
            <Card>
                <Title title={'Logs'} />
                <CardContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
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
                                            basePath="/logs"
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

export default LogsList;
