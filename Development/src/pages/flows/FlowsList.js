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
import FilterPanel, {
    RateFilter,
    StringFilter,
} from '../../components/FilterPanel';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';
import { queryVersion } from '../../settings';

const FlowsList = props => {
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
        <>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions url={url} />
            </div>
            <Card>
                <Title title={'Flows'} />
                <CardContent>
                    <FilterPanel filter={filter} setFilter={setFilter}>
                        <StringFilter source="label" />
                        <StringFilter source="description" />
                        {queryVersion() >= 'v1.1' && (
                            <RateFilter
                                source="grain_rate"
                                label="Grain Rate"
                            />
                        )}
                        <StringFilter source="format" />
                        {queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="media_type"
                                label="Media Type"
                            />
                        )}
                        {queryVersion() >= 'v1.1' && (
                            <RateFilter
                                source="sample_rate"
                                label="Sample Rate"
                            />
                        )}
                        {queryVersion() >= 'v1.3' && (
                            <StringFilter
                                source="event_type"
                                label="Event Type"
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
                                <TableCell>Format</TableCell>
                                {queryVersion() >= 'v1.1' && (
                                    <TableCell>Media Type</TableCell>
                                )}
                                {queryVersion() >= 'v1.3' && (
                                    <TableCell>Event Type</TableCell>
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
                                            basePath="/flows"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.format}</TableCell>
                                    {queryVersion() >= 'v1.1' && (
                                        <TableCell>{item.media_type}</TableCell>
                                    )}
                                    {queryVersion() >= 'v1.3' && (
                                        <TableCell>{item.event_type}</TableCell>
                                    )}
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

export default FlowsList;
