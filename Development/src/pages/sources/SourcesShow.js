import React from 'react';
import {
    ArrayField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceArrayField,
    ReferenceField,
    ReferenceManyField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    TopToolbar,
    useRecordContext,
    useShowController,
} from 'react-admin';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import MapObject from '../../components/ObjectField';
import RateField from '../../components/RateField';
import RawButton from '../../components/RawButton';
import ResourceTitle from '../../components/ResourceTitle';
import TAIField from '../../components/TAIField';
import { queryVersion } from '../../settings';

const SourcesShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<ResourceTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

export const SourcesShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <SourcesShowView {...props} />
        </ShowContextProvider>
    );
};

const SourcesShowView = props => {
    const { record } = useRecordContext();
    return (
        <ShowView
            {...props}
            title={<ResourceTitle />}
            actions={<SourcesShowActions />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                <TAIField source="version" />
                <TextField source="label" />
                <TextField source="description" />
                <FunctionField
                    label="Tags"
                    render={record =>
                        Object.keys(record.tags).length > 0
                            ? MapObject(record, 'tags')
                            : null
                    }
                />
                <hr />
                {queryVersion() >= 'v1.1' && (
                    <RateField label="Grain Rate" source="grain_rate" />
                )}
                {queryVersion() >= 'v1.1' && (
                    <TextField label="Clock Name" source="clock_name" />
                )}
                <TextField source="format" />
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:audio' && (
                        <ArrayField source="channels">
                            <Datagrid>
                                <TextField source="label" />
                                <TextField source="symbol" />
                            </Datagrid>
                        </ArrayField>
                    )}
                {queryVersion() >= 'v1.3' &&
                    record.format === 'urn:x-nmos:format:data' && (
                        <TextField label="Event Type" source="event_type" />
                    )}
                <hr />
                <ReferenceArrayField
                    allowEmpty={true}
                    clickable="true"
                    label="Parents"
                    source="parents"
                    reference="sources"
                    link="show"
                >
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceArrayField>
                <ReferenceField
                    label="Device"
                    source="device_id"
                    reference="devices"
                    link="show"
                >
                    <ChipConditionalLabel source="label" />
                </ReferenceField>
                <hr />
                <ReferenceManyField
                    label="Flows"
                    reference="flows"
                    target="source_id"
                >
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceManyField>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default SourcesShow;
