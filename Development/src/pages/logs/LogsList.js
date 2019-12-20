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
import { Loading, ShowButton, Title } from 'react-admin';
import FilterPanel, { StringFilter } from '../../components/FilterPanel';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

const LogsList = props => {
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
                <Title title={'Logs'} />
                <CardContent>
                    <FilterPanel
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                    >
                        <StringFilter source="timestamp" />
                        <StringFilter source="level" />
                        <StringFilter source="message" />
                        <StringFilter
                            source="request_uri"
                            label="Request URI"
                        />
                        <StringFilter
                            source="http_method"
                            label="HTTP Method"
                        />
                    </FilterPanel>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Timestamp
                                </TableCell>
                                <TableCell>Level</TableCell>
                                <TableCell>Message</TableCell>
                                <TableCell>Request URI</TableCell>
                                <TableCell>HTTP Method</TableCell>
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
