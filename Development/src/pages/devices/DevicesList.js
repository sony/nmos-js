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
import { map } from 'lodash';
import FilterPanel, {
    AutocompleteFilter,
    StringFilter,
} from '../../components/FilterPanel';
import {
    CONTROL_TYPES,
    DEVICE_TYPES,
    parameterAutocompleteProps,
    parameterLabel,
    parametersLabel,
} from '../../components/ParameterRegisters';
import PaginationButtons from '../../components/PaginationButtons';
import ListActions from '../../components/ListActions';
import useGetList from '../../components/useGetList';
import { queryVersion, useJSONSetting } from '../../settings';

const DevicesList = props => {
    const [filter, setFilter] = useJSONSetting('Devices Filter');
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
                <Title title={'Devices'} />
                <CardContent>
                    <FilterPanel filter={filter} setFilter={setFilter}>
                        <StringFilter source="label" />
                        {queryVersion() >= 'v1.1' && (
                            <StringFilter source="description" />
                        )}
                        <AutocompleteFilter
                            source="type"
                            {...parameterAutocompleteProps(DEVICE_TYPES)}
                        />
                        <AutocompleteFilter
                            label="Control Types"
                            source="controls.type"
                            {...parameterAutocompleteProps(CONTROL_TYPES)}
                        />
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
                                <TableCell>Type</TableCell>
                                <TableCell>Control Types</TableCell>
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
                                    <TableCell>
                                        {parameterLabel(DEVICE_TYPES)(
                                            item.type
                                        )}
                                    </TableCell>
                                    {queryVersion() >= 'v1.1' && (
                                        <TableCell>
                                            {parametersLabel(CONTROL_TYPES)(
                                                map(item.controls, 'type')
                                            )}
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

export default DevicesList;
