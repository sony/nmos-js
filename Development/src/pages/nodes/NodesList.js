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
import { Button, ShowButton, Title } from 'react-admin';
import FilterField from '../../components/FilterField';
import JsonIcon from '../../components/JsonIcon';
import PaginationButton from '../../components/PaginationButton';
import dataProvider from '../../dataProvider';
import QueryVersion from '../../components/QueryVersion';

const NodesList = () => {
    const firstLoad = async () => {
        const params = {
            filter: {},
        };
        const dataObject = await dataProvider('GET_LIST', 'nodes', params);
        setData(dataObject);
    };

    const [data, setData] = useState(firstLoad);

    const nextPage = async label => {
        const dataObject = await dataProvider(label, 'nodes');
        setData(dataObject);
    };

    const [filterState, setFilterState] = useState({});

    const changeFilter = async (filterValue, name) => {
        let filter = filterState;
        if (filterValue) {
            filter[name] = filterValue;
        } else {
            delete filter[name];
        }
        const filteredDataObject = await dataProvider('GET_LIST', 'nodes', {
            filter: filter,
        });
        setFilterState(filter);
        setData(filteredDataObject);
    };

    const clearFilter = async () => {
        setData(firstLoad());
        setFilterState({});
    };

    const copyField = data => {
        const el = document.createElement('textarea');
        el.value = data;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    };

    if (data.hasOwnProperty('data')) {
        return (
            <Card>
                <Title title={'Nodes'} />
                <CardContent>
                    <Button
                        label={'Raw'}
                        href={data.url}
                        style={{ float: 'right' }}
                        title={'View raw'}
                    >
                        <JsonIcon />
                    </Button>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        minWidth: '240px',
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Label{' '}
                                    <FilterField
                                        name="label"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                <TableCell style={{ minWidth: '265px' }}>
                                    Hostname{' '}
                                    <FilterField
                                        name="hostname"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                {QueryVersion() >= 'v1.1' && (
                                    <TableCell style={{ minWidth: '280px' }}>
                                        API Versions{' '}
                                        <FilterField
                                            name="api.versions"
                                            setFilter={changeFilter}
                                        />
                                    </TableCell>
                                )}
                                <TableCell style={{ minWidth: '255px' }}>
                                    Node ID{' '}
                                    <FilterField
                                        name="id"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.data.map(item => (
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
                                    <TableCell
                                        onDoubleClick={() => copyField(item.id)}
                                    >
                                        {item.id}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <br />
                    <PaginationButton label="FIRST" nextPage={nextPage} />
                    <PaginationButton label="PREV" nextPage={nextPage} />
                    <PaginationButton label="NEXT" nextPage={nextPage} />
                    <PaginationButton label="LAST" nextPage={nextPage} />
                    <Button
                        onClick={() => clearFilter()}
                        label="Clear All Filters"
                    />
                </CardContent>
            </Card>
        );
    } else {
        return (
            <div>
                <p>Waiting for data...</p>
            </div>
        );
    }
};

export default NodesList;
