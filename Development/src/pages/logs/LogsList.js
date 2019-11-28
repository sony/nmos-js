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
import { Error, Loading, ShowButton, Title } from 'react-admin';
import FilterField from '../../components/FilterField';
import PaginationButton from '../../components/PaginationButton';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

const LogsList = props => {
    const [filter, setFilter] = useState({});
    const [paginationCursor, setPaginationCursor] = useState(null);
    // As the paginationCursor variable has not changed we need to force an update
    const [seed, setSeed] = useState(Math.random());

    const { data, error, loaded, url } = useGetList({
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
                    <PaginationButton label="FIRST" nextPage={nextPage} />
                    <PaginationButton label="PREV" nextPage={nextPage} />
                    <PaginationButton label="NEXT" nextPage={nextPage} />
                    <PaginationButton label="LAST" nextPage={nextPage} />
                </CardContent>
            </Card>
        </Fragment>
    );
};

export default LogsList;
