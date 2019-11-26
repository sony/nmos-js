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
import { Error, Loading, ShowButton, Title } from 'react-admin';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import FilterField from '../../components/FilterField';
import PaginationButton from '../../components/PaginationButton';
import QueryVersion from '../../components/QueryVersion';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';

const ReceiversList = props => {
    const [filter, setFilter] = useState({});
    const [paginationCursor, setPaginationCursor] = useState(null);
    // As the paginationCursor variable has not changed we need to force an update
    const [seed, setSeed] = useState(Math.random());

    const { data, error, loaded } = useGetList({
        ...props,
        filter,
        paginationCursor,
        seed,
    });

    const nextPage = label => {
        setPaginationCursor(label);
        setSeed(Math.random());
    };

    const changeFilter = (filterValue, name) => {
        let currentFilter = filter;
        if (filterValue) {
            currentFilter[name] = filterValue;
        } else {
            delete currentFilter[name];
        }
        setFilter(currentFilter);
        setPaginationCursor(null);
        setSeed(Math.random());
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
                <Title title={'Receivers'} />
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
                                <TableCell style={{ minWidth: '245px' }}>
                                    Format{' '}
                                    <FilterField
                                        name="format"
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
                                            basePath="/receivers"
                                            record={item}
                                            label={item.label}
                                        />
                                    </TableCell>
                                    <TableCell>{item.format}</TableCell>
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

export default ReceiversList;
