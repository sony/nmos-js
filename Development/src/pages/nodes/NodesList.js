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
import { Loading, ShowButton, Title } from 'react-admin';
import FilterPanel, { StringFilter } from '../../components/FilterPanel';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';
import { queryVersion, useJSONSetting } from '../../settings';

const NodesList = props => {
    const [filter, setFilter] = useJSONSetting('Nodes Filter');
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
                <ListActions url={url} />
            </div>
            <Card>
                <Title title={'Nodes'} />
                <CardContent>
                    <FilterPanel filter={filter} setFilter={setFilter}>
                        <StringFilter source="label" />
                        {queryVersion() >= 'v1.1' && (
                            <StringFilter source="description" />
                        )}
                        <StringFilter source="hostname" />
                        {queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="api.versions"
                                label="API Version"
                            />
                        )}
                        {queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="api.endpoints.host"
                                label="API Endpoint Host"
                            />
                        )}
                        {queryVersion() >= 'v1.2' && (
                            <StringFilter
                                source="interfaces.port_id"
                                label="Interface Port ID"
                            />
                        )}
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
                                    Label
                                </TableCell>
                                <TableCell>Hostname</TableCell>
                                {queryVersion() >= 'v1.1' && (
                                    <TableCell>API Versions</TableCell>
                                )}
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
                                            basePath="/nodes"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.hostname}</TableCell>
                                    {queryVersion() >= 'v1.1' && (
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
                        pagination={pagination}
                        nextPage={nextPage}
                        {...props}
                    />
                </CardContent>
            </Card>
        </>
    );
};

export default NodesList;
