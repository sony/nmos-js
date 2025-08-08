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
    FORMATS,
    ParameterField,
    TRANSPORTS,
    parameterAutocompleteProps,
} from '../../components/ParameterRegisters';
import ActiveField from '../../components/ActiveField';
import LinkChipField from '../../components/LinkChipField';
import PaginationButtons from '../../components/PaginationButtons';
import ResourceTitle from '../../components/ResourceTitle';
import ConnectButtons from './ConnectButtons';
import {
    QUERY_API,
    apiUsingRql,
    queryVersion,
    useJSONSetting,
} from '../../settings';

const ConnectionManagementTab = ({ receiverData, basePath }) => {
    const baseFilter = useMemo(() => {
        let transport = get(receiverData, 'transport');
        // Transport URNs use the following construction:
        // <URN-base>[.<subclassification>][/<version>]
        // Ideally, for an "rtp" receiver (a base classification):
        // - match "rtp" senders (the base classification)
        // - match "rtp.mcast" or "rtp.ucast" senders (any subclassification)
        // Ideally, for an "rtp.mcast" receiver (a specific subclassification):
        // - match "rtp.mcast" senders (the same subclassification)
        // - match "rtp" senders (the base classification), since these senders may be in multicast mode
        // - do not match "rtp.ucast" senders (a different subclassification)
        // This can be done with a single RQL matches() call but not using basic query syntax
        if (apiUsingRql(QUERY_API)) {
            const dot = transport.indexOf('.');
            const slash = transport.indexOf('/');
            if (dot !== -1 && (slash === -1 || dot < slash)) {
                const base = transport.substring(0, dot);
                // match transport subclassification or its URN-base with no subclassification
                // ('|' separates alternatives, '$' means match end of string)
                transport = transport + '|' + base + '$';
            }
        }
        return {
            transport,
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
        filter: useMemo(
            () => ({ ...baseFilter, ...filter }),
            [baseFilter, filter]
        ),
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
                            {...parameterAutocompleteProps(TRANSPORTS)}
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
                            {...parameterAutocompleteProps(FORMATS)}
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
                        {apiUsingRql(QUERY_API) && (
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
                                            name="label"
                                        >
                                            <LinkChipField record={item} />
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <ParameterField
                                            record={item}
                                            register={TRANSPORTS}
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
                                            <ParameterField
                                                source="format"
                                                register={FORMATS}
                                            />
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

const eventTypes = ['boolean', 'string', 'number'];

export default ConnectionManagementTab;
