import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import {
    Loading,
    ReferenceField,
    TextField,
    TitleForRecord,
    linkToRecord,
} from 'react-admin';
import get from 'lodash/get';
import useGetList from '../../components/useGetList';
import FilterPanel, {
    AutocompleteFilter,
    BooleanFilter,
    ConstFilter,
    RateFilter,
    StringFilter,
} from '../../components/FilterPanel';
import {
    FORMAT_INFO,
    TRANSPORT_INFO,
} from '../../components/ParameterRegisters';
import ActiveField from '../../components/ActiveField';
import LinkChipField from '../../components/LinkChipField';
import PaginationButtons from '../../components/PaginationButtons';
import ResourceTitle from '../../components/ResourceTitle';
import ConnectButtons from './ConnectButtons';
import {
    QUERY_API,
    apiUseRql,
    queryVersion,
    useJSONSetting,
} from '../../settings';

const ConnectionManagementTab = ({ receiverData, basePath }) => {
    const baseFilter = useMemo(() => {
        return {
            transport: get(receiverData, 'transport'),
            '$flow.format': get(receiverData, 'format'),
            ...(queryVersion() >= 'v1.1' && {
                '$flow.media_type': get(receiverData, 'caps.media_types'),
            }),
            ...(queryVersion() >= 'v1.3' && {
                '$flow.event_type': get(receiverData, 'caps.event_types'),
            }),
            $constraint_sets: get(receiverData, 'caps.constraint_sets'),
        };
    }, [receiverData]);

    const [filter, setFilter] = useJSONSetting('Connect Filter');
    const [paginationURL, setPaginationURL] = useState(null);
    const { data, loaded, pagination } = useGetList({
        basePath,
        filter: useMemo(() => ({ ...baseFilter, ...filter }), [
            baseFilter,
            filter,
        ]),
        paginationURL,
        resource: 'senders',
    });

    const nextPage = label => {
        setPaginationURL(pagination[label]);
    };

    if (!loaded) return <Loading />;

    return (
        <>
            <TitleForRecord
                record={receiverData}
                title={<ResourceTitle record={receiverData} />}
            />
            <Card>
                <CardContent>
                    <FilterPanel
                        data={data}
                        defaultFilter={baseFilter}
                        filter={filter}
                        setFilter={setFilter}
                    >
                        <StringFilter source="label" label="Sender Label" />
                        <StringFilter
                            source="description"
                            label="Sender Description"
                        />
                        <AutocompleteFilter
                            source="transport"
                            freeSolo
                            options={transports}
                            renderOption={renderTransport}
                            label="Sender Transport"
                        />
                        {queryVersion() >= 'v1.2' && (
                            <BooleanFilter
                                source="subscription.active"
                                label="Sender Active"
                            />
                        )}
                        <StringFilter source="id" label="Sender ID" />
                        <AutocompleteFilter
                            source="$flow.format"
                            freeSolo
                            options={formats}
                            renderOption={renderFormat}
                        />
                        {queryVersion() >= 'v1.1' && (
                            <RateFilter source="$flow.grain_rate" />
                        )}
                        {queryVersion() >= 'v1.1' && (
                            <RateFilter source="$flow.sample_rate" />
                        )}
                        {queryVersion() >= 'v1.1' && (
                            <StringFilter source="$flow.media_type" />
                        )}
                        {queryVersion() >= 'v1.3' && (
                            <AutocompleteFilter
                                source="$flow.event_type"
                                freeSolo
                                options={eventTypes}
                            />
                        )}
                        {apiUseRql(QUERY_API) && (
                            <ConstFilter
                                source="$constraint_sets_active"
                                label="Constraint Sets"
                            />
                        )}
                    </FilterPanel>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    style={{
                                        paddingLeft: '32px',
                                    }}
                                >
                                    Sender
                                </TableCell>
                                <TableCell>Transport</TableCell>
                                {queryVersion() >= 'v1.2' && (
                                    <TableCell>Active</TableCell>
                                )}
                                <TableCell>Flow</TableCell>
                                <TableCell>Format</TableCell>
                                {queryVersion() >= 'v1.1' && (
                                    <TableCell>Media Type</TableCell>
                                )}
                                {queryVersion() >= 'v1.3' && (
                                    <TableCell>Event Type</TableCell>
                                )}
                                <TableCell>Connect</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map(item => (
                                <TableRow
                                    key={item.id}
                                    selected={
                                        get(receiverData, 'id') === item.id
                                    }
                                >
                                    <TableCell component="th" scope="row">
                                        {
                                            // Using linkToRecord because ReferenceField will
                                            // make a new unnecessary network request
                                        }
                                        <Link
                                            to={`${linkToRecord(
                                                '/senders',
                                                item.id
                                            )}/show`}
                                            style={{
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <LinkChipField record={item} />
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.transport}</TableCell>
                                    {queryVersion() >= 'v1.2' && (
                                        <TableCell>
                                            <ActiveField
                                                record={item}
                                                resource="senders"
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <ReferenceField
                                            record={item}
                                            basePath="/flows"
                                            label="Flow"
                                            source="flow_id"
                                            reference="flows"
                                            link="show"
                                        >
                                            <LinkChipField />
                                        </ReferenceField>
                                    </TableCell>
                                    <TableCell>
                                        <ReferenceField
                                            record={item}
                                            basePath="/flows"
                                            label="Format"
                                            source="flow_id"
                                            reference="flows"
                                            link={false}
                                        >
                                            <TextField source="format" />
                                        </ReferenceField>
                                    </TableCell>
                                    {queryVersion() >= 'v1.1' && (
                                        <TableCell>
                                            <ReferenceField
                                                record={item}
                                                basePath="/flows"
                                                label="Media Type"
                                                source="flow_id"
                                                reference="flows"
                                                link={false}
                                            >
                                                <TextField source="media_type" />
                                            </ReferenceField>
                                        </TableCell>
                                    )}
                                    {queryVersion() >= 'v1.3' && (
                                        <TableCell>
                                            <ReferenceField
                                                record={item}
                                                basePath="/flows"
                                                label="Event Type"
                                                source="flow_id"
                                                reference="flows"
                                                link={false}
                                            >
                                                <TextField source="event_type" />
                                            </ReferenceField>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <ConnectButtons
                                            senderData={item}
                                            receiverData={receiverData}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <br />
                    <PaginationButtons
                        pagination={pagination}
                        nextPage={nextPage}
                    />
                </CardContent>
            </Card>
        </>
    );
};

const formats = Object.keys(FORMAT_INFO);

const renderFormat = (format, state) => {
    const info = get(FORMAT_INFO, format);
    if (info) {
        return info.label;
    } else {
        return format;
    }
};

const transports = Object.keys(TRANSPORT_INFO);

const renderTransport = (transport, state) => {
    const info = get(TRANSPORT_INFO, transport);
    if (info) {
        return info.label;
    } else {
        return transport;
    }
};

const eventTypes = ['boolean', 'string', 'number'];

export default ConnectionManagementTab;
