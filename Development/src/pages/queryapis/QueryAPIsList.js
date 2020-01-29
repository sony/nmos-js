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
import ListActions from '../../components/ListActions';
import ConnectButton from '../../components/ConnectButton';
import useDebounce from '../../components/useDebounce';
import useGetList from '../../components/useGetList';

const QueryAPIsList = props => {
    const [filter, setFilter] = useState({});
    const debouncedFilter = useDebounce(filter, 250);
    const { data, loaded, url } = useGetList({
        ...props,
        filter: debouncedFilter,
    });
    if (!loaded) return <Loading />;

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
                        <StringFilter source="domain" />
                    </FilterPanel>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Name
                                </TableCell>
                                <TableCell>API Versions</TableCell>
                                <TableCell>Priority</TableCell>
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
                                            basePath="/queryapis"
                                            record={item}
                                            label={item.name}
                                        />
                                    </TableCell>
                                    <TableCell>{item.txt.api_ver}</TableCell>
                                    <TableCell>{item.txt.pri}</TableCell>
                                    <TableCell>
                                        <ConnectButton
                                            record={item}
                                            variant="text"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </Fragment>
    );
};

export default QueryAPIsList;
