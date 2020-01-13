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
import QueryVersion from '../../components/QueryVersion';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

const NodesList = props => {
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
                <Title title={'Nodes'} />
                <CardContent>
                    <FilterPanel filter={filter} setFilter={setFilter}>
                        <StringFilter source="label" />
                        <StringFilter source="hostname" />
                        {QueryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="api.versions"
                                label="API Versions"
                            />
                        )}
                        <StringFilter source="id" label="Node ID" />
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
                                <TableCell>Hostname</TableCell>
                                {QueryVersion() >= 'v1.1' && (
                                    <TableCell>API Versions</TableCell>
                                )}
                                <TableCell>Node ID</TableCell>
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
                                            basePath="/nodes"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.hostname}</TableCell>
                                    {QueryVersion() >= 'v1.1' && (
                                        <TableCell>
                                            {item.api.versions.join(', ')}
                                        </TableCell>
                                    )}
                                    <TableCell>{item.id}</TableCell>
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

export default NodesList;
