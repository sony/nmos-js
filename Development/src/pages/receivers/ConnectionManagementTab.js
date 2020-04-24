import React, { Fragment, useEffect, useState } from 'react';
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
    BooleanFilter,
    StringFilter,
} from '../../components/FilterPanel';
import QueryVersion from '../../components/QueryVersion';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import ActiveField from '../../components/ActiveField';
import ConnectButtons from './ConnectButtons';
import PaginationButtons from '../../components/PaginationButtons';
import { ReceiversTitle } from './ReceiversShow';

const ConnectionManagementTab = ({ receiverData, basePath }) => {
    const [filter, setFilter] = useState({});
    const [paginationURL, setPaginationURL] = useState(null);
    const { data, loaded, pagination } = useGetList({
        basePath,
        filter,
        paginationURL,
        resource: 'senders',
    });

    // receiverData initialises undefined, update when no longer null
    useEffect(() => {
        if (receiverData !== null) {
            let permanentFilter = {
                transport: get(receiverData, 'transport'),
                '$flow.format': get(receiverData, 'format'),
            };
            if (QueryVersion() >= 'v1.1') {
                permanentFilter['$flow.media_type'] = get(
                    receiverData,
                    'caps.media_types'
                );
            }
            if (QueryVersion() >= 'v1.3') {
                permanentFilter['$flow.event_type'] = get(
                    receiverData,
                    'caps.event_types'
                );
            }
            setFilter(f => ({ ...f, ...permanentFilter }));
        }
    }, [receiverData]);

    if (!loaded) return <Loading />;

    const nextPage = label => {
        setPaginationURL(pagination[label]);
    };

    return (
        <Fragment>
            <TitleForRecord
                record={receiverData}
                title={<ReceiversTitle record={receiverData} />}
            />
            <Card>
                <CardContent>
                    <FilterPanel
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                    >
                        <StringFilter source="label" label="Sender Label" />
                        <StringFilter
                            source="description"
                            label="Sender Description"
                        />
                        {QueryVersion() >= 'v1.2' && (
                            <BooleanFilter
                                source="subscription.active"
                                label="Sender Active"
                            />
                        )}
                        <StringFilter source="id" label="Sender ID" />
                        {QueryVersion() >= 'v1.1' && (
                            <StringFilter
                                source="$flow.media_type"
                                label="Media Type"
                            />
                        )}
                        {QueryVersion() >= 'v1.3' && (
                            <StringFilter
                                source="$flow.event_type"
                                label="Event Type"
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
                                {QueryVersion() >= 'v1.2' && (
                                    <TableCell>Active</TableCell>
                                )}
                                <TableCell>Flow</TableCell>
                                <TableCell>Format</TableCell>
                                {QueryVersion() >= 'v1.1' && (
                                    <TableCell>Media Type</TableCell>
                                )}
                                {QueryVersion() >= 'v1.3' && (
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
                                            // Using linkToRecord as ReferenceField will
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
                                            <ChipConditionalLabel
                                                record={item}
                                                source="label"
                                                label="ra.action.show"
                                            />
                                        </Link>
                                    </TableCell>
                                    {QueryVersion() >= 'v1.2' && (
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
                                            <ChipConditionalLabel source="label" />
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
                                    {QueryVersion() >= 'v1.1' && (
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
                                    {QueryVersion() >= 'v1.3' && (
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
        </Fragment>
    );
};

export default ConnectionManagementTab;
