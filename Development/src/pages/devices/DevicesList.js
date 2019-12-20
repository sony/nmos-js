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

const DevicesList = props => {
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
                <Title title={'Devices'} />
                <CardContent>
                    <FilterPanel
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                    >
                        <StringFilter source="label" />
                        <StringFilter source="type" />
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
                                <TableCell>Type</TableCell>
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
                                            basePath="/devices"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.type}</TableCell>
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

export default DevicesList;
