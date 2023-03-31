import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { Loading, ShowButton, Title } from 'react-admin';
import { get, groupBy, map, uniqBy } from 'lodash';
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
import {
    QUERY_API,
    apiUsingRql,
    queryVersion,
    useJSONSetting,
} from '../../settings';

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
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <Divider />
                        )}
                        {
                            // Work-in-progress BCP-002-02 Asset Distinguishing Information
                            // See https://specs.amwa.tv/bcp-002-02/
                        }
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="(tags,urn%3Ax-nmos%3Atag%3Aasset%3Amanufacturer%2Fv1.0)"
                                label="Manufacturer"
                            />
                        )}
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="(tags,urn%3Ax-nmos%3Atag%3Aasset%3Aproduct%2Fv1.0)"
                                label="Product Name"
                            />
                        )}
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="(tags,urn%3Ax-nmos%3Atag%3Aasset%3Ainstance-id%2Fv1.0)"
                                label="Instance Identifier"
                            />
                        )}
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="(tags,urn%3Ax-nmos%3Atag%3Aasset%3Afunction%2Fv1.0)"
                                label="Function"
                            />
                        )}
                        {apiUsingRql(QUERY_API) && queryVersion() >= 'v1.1' && (
                            <Divider />
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
                                <TableCell>Manufacturer</TableCell>
                                <TableCell>Product</TableCell>
                                <TableCell>Instance</TableCell>
                                <TableCell>Application</TableCell>
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
                                        {get(
                                            item.tags,
                                            'urn:x-nmos:tag:asset:facts:manufacturer/v1.0',
                                            []
                                        ).join(', ')}
                                    </TableCell>
                                    <TableCell>
                                        {get(
                                            item.tags,
                                            'urn:x-nmos:tag:asset:facts:product/v1.0',
                                            []
                                        ).join(', ')}
                                    </TableCell>
                                    <TableCell>
                                        {get(
                                            item.tags,
                                            'urn:x-nmos:tag:asset:facts:instance/v1.0',
                                            []
                                        ).join(', ')}
                                    </TableCell>
                                    <TableCell>
                                        {get(
                                            item.tags,
                                            'urn:x-nmos:tag:asset:facts:application/v1.0',
                                            []
                                        ).join(', ')}
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
