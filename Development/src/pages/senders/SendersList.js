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
import { Error, Loading, ShowButton, Title, useQuery } from 'react-admin';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import FilterField from '../../components/FilterField';
import PaginationButton from '../../components/PaginationButton';
import QueryVersion from '../../components/QueryVersion';
import ListActions from '../../components/ListActions';

const SendersList = props => {
    const [type, setType] = useState('getList');
    const [params, setParams] = useState({
        filter: {},
    });

    const { data, loaded, error } = useQuery({
        type: type,
        resource: 'senders',
        payload: type === 'getList' ? params : {},
    });

    const nextPage = label => {
        setType(label);
    };

    const changeFilter = (filterValue, name) => {
        let filter = params.filter;
        if (filterValue) {
            filter[name] = filterValue;
        } else {
            delete filter[name];
        }
        setType('getList');
        setParams({ filter: filter });
    };

    if (!loaded) return <Loading />;
    if (error) return <Error />;
    if (!data) return null;

    return (
        <>
            <div style={{ display: 'flex' }}>
                <span style={{ flexGrow: 1 }} />
                <ListActions {...props} />
            </div>
            <Card>
                <Title title={'Senders'} />
                <CardContent>
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
                                <TableCell style={{ minWidth: '260px' }}>
                                    Transport{' '}
                                    <FilterField
                                        name="transport"
                                        setFilter={changeFilter}
                                    />
                                </TableCell>
                                {QueryVersion() >= 'v1.2' && (
                                    <TableCell>Active</TableCell>
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
                                            basePath="/senders"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.transport}</TableCell>
                                    {QueryVersion() >= 'v1.2' && (
                                        <TableCell>
                                            {item.subscription.active ? (
                                                <CheckIcon />
                                            ) : (
                                                <ClearIcon />
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <br />
                    <PaginationButton label="FIRST" nextPage={nextPage} />
                    <PaginationButton label="PREV" nextPage={nextPage} />
                    <PaginationButton label="NEXT" nextPage={nextPage} />
                    <PaginationButton label="LAST" nextPage={nextPage} />
                </CardContent>
            </Card>
        </>
    );
};

export default SendersList;
