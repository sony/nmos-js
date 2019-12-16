import React from 'react';
import {
    Button,
    FunctionField,
    ListButton,
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
} from 'react-admin';
import Cookies from 'universal-cookie';
import JsonIcon from '../../icons/JsonIcon';
import MapTags from '../../components/TagsField';

const cookies = new Cookies();

const LogsTitle = ({ record }) => {
    return <span>Log: {record ? `${record.timestamp}` : ''}</span>;
};

const LogsShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<LogsTitle />}>
        {data ? (
            <Button
                label={'Raw'}
                href={
                    cookies.get('Logging API') + '/' + resource + '/' + data.id
                }
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

const LogsShow = props => (
    <Show title={<LogsTitle />} actions={<LogsShowActions />} {...props}>
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
                            ? MapTags(record)
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
    </Show>
);

export default LogsShow;
