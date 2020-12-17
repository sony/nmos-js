import React from 'react';
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
import ConnectButton from './ConnectButton';
import useGetList from '../../components/useGetList';
import { useJSONSetting } from '../../settings';

const QueryAPIsList = props => {
    const [filter, setFilter] = useJSONSetting('Query APIs Filter');
    const { data, loaded, url } = useGetList({
        ...props,
        filter,
    });
    if (!loaded) return <Loading />;

    return (
        <>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions url={url} />
            </div>
            <Card>
                <Title title={'Query APIs'} />
                <CardContent>
                    <FilterPanel filter={filter} setFilter={setFilter}>
                        <StringFilter
                            source="query.domain"
                            label="Browse Domain"
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
        </>
    );
};

export default QueryAPIsList;
