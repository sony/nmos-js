import React from 'react';
import {
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import ObjectField from '../../components/ObjectField';
import ResourceShowActions from '../../components/ResourceShowActions';
import ResourceTitle from '../../components/ResourceTitle';
import SanitizedDivider from '../../components/SanitizedDivider';

export const LogsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <LogsShowView {...props} />
        </ShowContextProvider>
    );
};

const LogsShowView = props => {
    const { record } = useRecordContext();
    return (
        <ShowView
            title={<ResourceTitle recordLabel={get(record, 'timestamp')} />}
            actions={<ResourceShowActions />}
            {...props}
        >
            <SimpleShowLayout>
                <TextField source="timestamp" />
                <TextField source="level" />
                <TextField source="level_name" label="Level Name" />
                <TextField source="message" />
                <ObjectField source="tags" />
                <TextField source="http_method" label="HTTP Method" />
                <TextField source="request_uri" label="Request URI" />
                <SanitizedDivider />
                <TextField source="source_location.file" label="Source File" />
                <TextField source="source_location.line" label="Source Line" />
                <TextField
                    source="source_location.function"
                    label="Source Function"
                />
                <SanitizedDivider />
                <TextField source="thread_id" label="Thread ID" />
                <TextField source="id" label="ID" />
            </SimpleShowLayout>
        </ShowView>
    );
};

export default LogsShow;
