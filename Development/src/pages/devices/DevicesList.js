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
import { groupBy, map, uniqBy } from 'lodash';
import FilterPanel, {
    AutocompleteFilter,
    StringFilter,
} from '../../components/FilterPanel';
import {
    CONTROL_TYPES,
    DEVICE_TYPES,
    ParameterField,
    parameterAutocompleteProps,
    parameterVersion,
    unversionedParameter,
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
                                        <ParameterField
                                            register={DEVICE_TYPES}
                                            record={item}
                                            source="type"
                                        />
                                    </TableCell>
                                    {queryVersion() >= 'v1.1' && (
                                        <TableCell>
                                            {map(
                                                groupedControlTypes(item),
                                                (_, index) => (
                                                    <ParameterField
                                                        key={index}
                                                        register={CONTROL_TYPES}
                                                        record={{ _ }}
                                                        source="_"
                                                    />
                                                )
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

// there's no doubt something more elegant than this dance, but for now it escapes me
const groupedControlTypes = record =>
    map(
        groupBy(record.controls, control => unversionedParameter(control.type)),
        (controls, unversioned) =>
            unversioned +
            '/' +
            map(uniqBy(controls, 'type'), control =>
                parameterVersion(control.type)
            ).join(', ')
    );

export default DevicesList;
