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
import ActiveField from '../../components/ActiveField';
import FilterPanel, {
    AutocompleteFilter,
    BooleanFilter,
    StringFilter,
} from '../../components/FilterPanel';
import {
    ParameterField,
    TRANSPORTS,
    parameterAutocompleteProps,
} from '../../components/ParameterRegisters';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';
import { queryVersion, useJSONSetting } from '../../settings';

const SendersList = props => {
    const [filter, setFilter] = useJSONSetting('Senders Filter');
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
                <Title title={'Senders'} />
                <CardContent>
                    <FilterPanel filter={filter} setFilter={setFilter}>
                        <StringFilter source="label" />
                        <StringFilter source="description" />
                        <AutocompleteFilter
                            source="transport"
                            {...parameterAutocompleteProps(TRANSPORTS)}
                        />
                        {queryVersion() >= 'v1.2' && (
                            <BooleanFilter
                                source="subscription.active"
                                label="Active"
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
                                <TableCell>Transport</TableCell>
                                {queryVersion() >= 'v1.2' && (
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
                                            name="label"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <ParameterField
                                            register={TRANSPORTS}
                                            record={item}
                                            source="transport"
                                        />
                                    </TableCell>
                                    {queryVersion() >= 'v1.2' && (
                                        <TableCell>
                                            <ActiveField
                                                record={item}
                                                resource="senders"
                                            />
                                        </TableCell>
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

export default SendersList;
