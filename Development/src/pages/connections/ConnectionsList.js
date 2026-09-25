import React, { useState } from 'react';
import { Card, CardContent, Divider } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Loading, Title } from 'react-admin';
import get from 'lodash/get';

import FilterPanel, {
    AutocompleteFilter,
    BooleanFilter,
    ConstFilter,
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
import {
    RECEIVER_ESSENCE_KEYS,
    SENDER_ESSENCE_KEYS,
    applyHeadingMatch,
} from './connectionHeadingMatch';

// the Query API always offers a 'next' cursor, so only a full page indicates
// that this axis may be showing just some of the matching resources
export const isConnectionsAxisTruncated = (count, pagingLimit) =>
    Boolean(pagingLimit) && count >= pagingLimit;

const AxisFilters = ({ filter, setFilter, filterButtonLabel, resource }) => (
    <FilterPanel
        filter={filter}
        setFilter={setFilter}
        filterButtonLabel={filterButtonLabel}
        noFilters
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
        {
            // only a receiver heading match writes the constraint sets to
            // match against, so removing the filter takes them away too
            get(filter, '$constraint_sets') && (
                <ConstFilter
                    source="$constraint_sets_active"
                    clearSource="$constraint_sets"
                    label="Constraint Sets"
                />
            )
        }
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
    const [senderFilterEpoch, setSenderFilterEpoch] = useState(0);
    const [receiverFilterEpoch, setReceiverFilterEpoch] = useState(0);
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
                    key={`senders-${senderFilterEpoch}`}
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
                    key={`receivers-${receiverFilterEpoch}`}
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
                    onMatchReceivers={essence => {
                        setReceiverFilter(current =>
                            applyHeadingMatch(
                                current,
                                essence,
                                RECEIVER_ESSENCE_KEYS
                            )
                        );
                        setReceiverFilterEpoch(epoch => epoch + 1);
                    }}
                    onMatchSenders={essence => {
                        setSenderFilter(current =>
                            applyHeadingMatch(
                                current,
                                essence,
                                SENDER_ESSENCE_KEYS
                            )
                        );
                        setSenderFilterEpoch(epoch => epoch + 1);
                    }}
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
