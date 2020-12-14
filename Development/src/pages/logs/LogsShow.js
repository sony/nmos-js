import React from 'react';
import {
    FunctionField,
    ListButton,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    useShowController,
} from 'react-admin';
import MapObject from '../../components/ObjectField';
import RawButton from '../../components/RawButton';

const LogsTitle = ({ record }) => {
    return <span>Log: {record ? `${record.timestamp}` : ''}</span>;
};

const LogsShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<LogsTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

export const LogsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <LogsShowView {...props} />
        </ShowContextProvider>
    );
};

const LogsShowView = props => (
    <ShowView title={<LogsTitle />} actions={<LogsShowActions />} {...props}>
        <SimpleShowLayout>
            <TextField source="timestamp" />
            <TextField source="level" />
            <TextField source="level_name" label="Level Name" />
            <TextField source="message" />
            <FunctionField
                label="Tags"
                render={record =>
                    record.tags
                        ? Object.keys(record.tags).length > 0
                            ? MapObject(record, 'tags')
                            : null
                        : null
                }
            />
            <TextField source="http_method" label="HTTP Method" />
            <TextField source="request_uri" label="Request URI" />
            <hr />
            <TextField source="source_location.file" label="Source File" />
            <TextField source="source_location.line" label="Source Line" />
            <TextField
                source="source_location.function"
                label="Source Function"
            />
            <hr />
            <TextField source="thread_id" label="Thread ID" />
            <TextField source="id" label="ID" />
        </SimpleShowLayout>
    </ShowView>
);

export default LogsShow;
