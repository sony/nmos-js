import React from 'react';
import { Card, CardContent, Divider } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Loading, Title } from 'react-admin';
import get from 'lodash/get';

import FilterPanel, {
    AutocompleteFilter,
    BooleanFilter,
    StringFilter,
} from '../../components/FilterPanel';
import {
    FORMATS,
    TRANSPORTS,
    parameterAutocompleteProps,
} from '../../components/ParameterRegisters';
import useGetList from '../../components/useGetList';
import {
    QUERY_API,
    apiPagingLimit,
    queryVersion,
    useJSONSetting,
} from '../../settings';
import ConnectionsMatrix from './ConnectionsMatrix';

// the Query API always offers a 'next' cursor, so only a full page indicates
// that this axis may be showing just some of the matching resources
export const isConnectionsAxisTruncated = (count, pagingLimit) =>
    Boolean(pagingLimit) && count >= pagingLimit;

const AxisFilters = ({ filter, setFilter, filterButtonLabel, resource }) => (
    <FilterPanel
        filter={filter}
        setFilter={setFilter}
        filterButtonLabel={filterButtonLabel}
        clearAllFilters
    >
        <StringFilter source="label" />
        <StringFilter source="description" />
        <StringFilter source="device_id" label="Device ID" />
        <AutocompleteFilter
            source="transport"
            {...parameterAutocompleteProps(TRANSPORTS)}
        />
        {resource === 'senders' && (
            <AutocompleteFilter
                source="$flow.format"
                label="Flow Format"
                {...parameterAutocompleteProps(FORMATS)}
            />
        )}
        {resource === 'senders' && queryVersion() >= 'v1.1' && (
            <StringFilter source="$flow.media_type" label="Flow Media Type" />
        )}
        {resource === 'senders' && queryVersion() >= 'v1.3' && (
            <AutocompleteFilter
                source="$flow.event_type"
                label="Flow Event Type"
                freeSolo
                options={['boolean', 'string', 'number']}
            />
        )}
        {resource === 'receivers' && (
            <AutocompleteFilter
                source="format"
                {...parameterAutocompleteProps(FORMATS)}
            />
        )}
        {resource === 'receivers' && queryVersion() >= 'v1.1' && (
            <StringFilter source="caps.media_types" label="Media Type" />
        )}
        {resource === 'receivers' && queryVersion() >= 'v1.3' && (
            <AutocompleteFilter
                source="caps.event_types"
                label="Event Type"
                freeSolo
                options={['boolean', 'string', 'number']}
            />
        )}
        {queryVersion() >= 'v1.2' && (
            <BooleanFilter source="subscription.active" label="Active" />
        )}
        <StringFilter source="id" />
    </FilterPanel>
);

const TruncationNotice = ({ count, label, pagingLimit }) =>
    isConnectionsAxisTruncated(count, pagingLimit) ? (
        <Alert severity="info" style={{ margin: '8px 0' }}>
            Showing the first {count} matching {label}. Narrow the filters to
            see other results.
        </Alert>
    ) : null;

const ConnectionsList = () => {
    const [senderFilter, setSenderFilter] = useJSONSetting(
        'Connections Sender Filter'
    );
    const [receiverFilter, setReceiverFilter] = useJSONSetting(
        'Connections Receiver Filter'
    );
    const [settingsFilter, setSettingsFilter] = useJSONSetting(
        'Connections Settings'
    );
    const [expanded, setExpanded] = useJSONSetting('Connections Expanded', {
        senders: [],
        receivers: [],
    });
    const senders = useGetList({
        basePath: '/senders',
        filter: senderFilter,
        paginationURL: null,
        resource: 'senders',
    });
    const receivers = useGetList({
        basePath: '/receivers',
        filter: receiverFilter,
        paginationURL: null,
        resource: 'receivers',
    });
    const pagingLimit = apiPagingLimit(QUERY_API);

    if (!senders.loaded || !receivers.loaded) return <Loading />;

    return (
        <Card>
            <Title title="Connections" />
            <CardContent>
                <AxisFilters
                    filter={senderFilter}
                    setFilter={setSenderFilter}
                    filterButtonLabel={'Sender filters'}
                    resource="senders"
                />
                <TruncationNotice
                    count={senders.data.length}
                    label="senders"
                    pagingLimit={pagingLimit}
                />
                <Divider light style={{ margin: '8px 0' }} />
                <AxisFilters
                    filter={receiverFilter}
                    setFilter={setReceiverFilter}
                    filterButtonLabel={'Receiver filters'}
                    resource="receivers"
                />
                <TruncationNotice
                    count={receivers.data.length}
                    label="receivers"
                    pagingLimit={pagingLimit}
                />
                <Divider light style={{ margin: '8px 0' }} />
                <FilterPanel
                    filter={settingsFilter}
                    setFilter={setSettingsFilter}
                    filterButtonLabel="settings"
                    allFilters={false}
                >
                    <BooleanFilter source="auto sort" />
                    <BooleanFilter source="swap axes" />
                </FilterPanel>
                <ConnectionsMatrix
                    autoSort={get(settingsFilter, 'auto sort') || false}
                    expanded={expanded}
                    receivers={receivers.data}
                    senders={senders.data}
                    setExpanded={setExpanded}
                    supportsActive={queryVersion() >= 'v1.2'}
                    swapAxes={get(settingsFilter, 'swap axes') || false}
                />
            </CardContent>
        </Card>
    );
};

export default ConnectionsList;
