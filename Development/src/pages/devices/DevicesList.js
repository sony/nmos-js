import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@material-ui/core';
import { Loading, ShowButton, Title } from 'react-admin';
import { get, groupBy, map } from 'lodash';
import FilterPanel, {
    AutocompleteFilter,
    StringFilter,
} from '../../components/FilterPanel';
import {
    CONTROL_TYPE_INFO,
    DEVICE_TYPE_INFO,
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
                            freeSolo
                            options={deviceTypes}
                            renderOption={renderDeviceType}
                        />
                        <AutocompleteFilter
                            label="Control Types"
                            source="controls.type"
                            freeSolo
                            options={controlTypes}
                            renderOption={renderControlType}
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
                                    <TableCell>{item.type}</TableCell>
                                    {queryVersion() >= 'v1.1' && (
                                        <TableCell>
                                            {map(
                                                groupBy(
                                                    item.controls,
                                                    control =>
                                                        unversionedControlType(
                                                            control.type
                                                        )
                                                ),
                                                controlGroupLabel
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

const deviceTypes = Object.keys(DEVICE_TYPE_INFO);

const renderDeviceType = (deviceType, state) => {
    const info = get(DEVICE_TYPE_INFO, deviceType);
    if (info) {
        return info.label;
    } else {
        return deviceType;
    }
};

const controlTypes = [].concat.apply(
    [],
    map(CONTROL_TYPE_INFO, (info, unversionedType) =>
        map(
            info.versions,
            version => unversionedType + (version ? '/' + version : '')
        )
    )
);

const unversionedControlType = controlType => controlType.split('/')[0];
const controlTypeVersion = controlType => controlType.split('/')[1];

const renderControlType = (controlType, state) => {
    const unversioned = unversionedControlType(controlType);
    const version = controlTypeVersion(controlType);
    const info = get(CONTROL_TYPE_INFO, unversioned);
    if (info) {
        return info.label + (version ? ' ' + version : '');
    } else {
        return unversioned + (version ? '/' + version : '');
    }
};

const InlineTypography = props => (
    <Typography style={{ display: 'inline' }} {...props} />
);

const controlGroupLabel = (controlGroup, unversioned) => {
    const versions = [
        ...new Set(controlGroup.map(_ => controlTypeVersion(_.type))),
    ].join(', ');
    const info = get(CONTROL_TYPE_INFO, unversioned);
    if (info) {
        return (
            <div key={unversioned}>
                <InlineTypography variant="body2">
                    {unversioned + (versions ? '/' + versions : '')}
                </InlineTypography>
                <InlineTypography variant="body2" color="textSecondary">
                    &ensp;({info.label + (versions ? ' ' + versions : '')})
                </InlineTypography>
            </div>
        );
    } else {
        return (
            <Typography key={unversioned} variant="body2">
                {unversioned + (versions ? '/' + versions : '')}
            </Typography>
        );
    }
};

export default DevicesList;
