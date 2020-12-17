import React from 'react';
import {
    ArrayField,
    Datagrid,
    FunctionField,
    ReferenceArrayField,
    ReferenceField,
    ReferenceManyField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    useRecordContext,
    useShowController,
} from 'react-admin';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import MapObject from '../../components/ObjectField';
import RateField from '../../components/RateField';
import ResourceShowActions from '../../components/ResourceShowActions';
import ResourceTitle from '../../components/ResourceTitle';
import TAIField from '../../components/TAIField';
import { queryVersion } from '../../settings';

export const FlowsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <FlowsShowView {...props} />
        </ShowContextProvider>
    );
};

const FlowsShowView = props => {
    const { record } = useRecordContext();
    return (
        <ShowView
            {...props}
            title={<ResourceTitle />}
            actions={<ResourceShowActions />}
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
                <TextField source="format" />
                {queryVersion() >= 'v1.1' && (
                    <TextField label="Media Type" source="media_type" />
                )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:video' && (
                        <TextField label="Frame Width" source="frame_width" />
                    )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:video' && (
                        <TextField label="Frame Height" source="frame_height" />
                    )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:video' && (
                        <TextField
                            label="Interlace Mode"
                            source="interlace_mode"
                        />
                    )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:video' && (
                        <TextField source="colorspace" />
                    )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:video' && (
                        <ArrayField source="components">
                            <Datagrid>
                                <TextField source="name" />
                                <TextField source="height" />
                                <TextField source="width" />
                                <TextField
                                    label="Bit Depth"
                                    source="bit_depth"
                                />
                            </Datagrid>
                        </ArrayField>
                    )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:video' && (
                        <TextField
                            label="Transfer Characteristic"
                            source="transfer_characteristic"
                        />
                    )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:audio' && (
                        <RateField label="Sample Rate" source="sample_rate" />
                    )}
                {queryVersion() >= 'v1.1' &&
                    record.format === 'urn:x-nmos:format:audio' &&
                    record.media_type.startsWith('audio/L') && (
                        <TextField label="Bit Depth" source="bit_depth" />
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
                    reference="flows"
                    link="show"
                >
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceArrayField>
                {queryVersion() >= 'v1.1' && (
                    <ReferenceField
                        label="Device"
                        source="device_id"
                        reference="devices"
                        link="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                )}
                <ReferenceField
                    label="Source"
                    source="source_id"
                    reference="sources"
                    link="show"
                >
                    <ChipConditionalLabel source="label" />
                </ReferenceField>
                <hr />
                <ReferenceManyField
                    label="Senders"
                    reference="senders"
                    target="flow_id"
                >
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceManyField>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default FlowsShow;
