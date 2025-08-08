import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { Loading, ShowButton, Title } from 'react-admin';
import { get } from 'lodash';
import FilterPanel, { StringFilter } from '../../components/FilterPanel';
import ListActions from '../../components/ListActions';
import PaginationButtons from '../../components/PaginationButtons';
import useGetList from '../../components/useGetList';
import {
    QUERY_API,
    apiUsingRql,
    queryVersion,
    useJSONSetting,
} from '../../settings';

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
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <Divider />
                        )}
                        {
                            // Work-in-progress BCP-002-02 Asset Distinguishing Information
                            // See https://specs.amwa.tv/bcp-002-02/
                        }
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="(tags,urn%3Ax-nmos%3Atag%3Aasset%3Amanufacturer%2Fv1.0)"
                                label="Manufacturer"
                            />
                        )}
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="(tags,urn%3Ax-nmos%3Atag%3Aasset%3Aproduct%2Fv1.0)"
                                label="Product Name"
                            />
                        )}
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="(tags,urn%3Ax-nmos%3Atag%3Aasset%3Ainstance-id%2Fv1.0)"
                                label="Instance Identifier"
                            />
                        )}
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <Divider />
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
                                    Label
                                </TableCell>
                                <TableCell>Manufacturer</TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Instance Identifier</TableCell>
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
                                    <TableCell>
                                        {get(
                                            item.tags,
                                            'urn:x-nmos:tag:asset:manufacturer/v1.0',
                                            []
                                        ).join(', ')}
                                    </TableCell>
                                    <TableCell>
                                        {get(
                                            item.tags,
                                            'urn:x-nmos:tag:asset:product/v1.0',
                                            []
                                        ).join(', ')}
                                    </TableCell>
                                    <TableCell>
                                        {get(
                                            item.tags,
                                            'urn:x-nmos:tag:asset:instance-id/v1.0',
                                            []
                                        ).join(', ')}
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
