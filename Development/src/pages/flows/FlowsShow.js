import React from 'react';
import {
    ArrayField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceArrayField,
    ReferenceField,
    ReferenceManyField,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    TopToolbar,
    useShowController,
} from 'react-admin';
import MapObject from '../../components/ObjectField';
import RawButton from '../../components/RawButton';
import RateField from '../../components/RateField';
import TAIField from '../../components/TAIField';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import { queryVersion } from '../../settings';

const FlowsTitle = ({ record }) => {
    return (
        <span>
            Flow:{' '}
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

const FlowsShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<FlowsTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

const FlowsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<FlowsTitle />}
            actions={<FlowsShowActions />}
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
                {controllerProps.record && queryVersion() >= 'v1.1' && (
                    <RateField label="Grain Rate" source="grain_rate" />
                )}
                <TextField source="format" />
                {controllerProps.record && queryVersion() >= 'v1.1' && (
                    <TextField label="Media Type" source="media_type" />
                )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' && (
                        <TextField label="Frame Width" source="frame_width" />
                    )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' && (
                        <TextField label="Frame Height" source="frame_height" />
                    )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' && (
                        <TextField
                            label="Interlace Mode"
                            source="interlace_mode"
                        />
                    )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' && (
                        <TextField source="colorspace" />
                    )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' && (
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
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' && (
                        <TextField
                            label="Transfer Characteristic"
                            source="transfer_characteristic"
                        />
                    )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:audio' && (
                        <RateField label="Sample Rate" source="sample_rate" />
                    )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:audio' &&
                    controllerProps.record.media_type.startsWith('audio/L') && (
                        <TextField label="Bit Depth" source="bit_depth" />
                    )}
                {controllerProps.record &&
                    queryVersion() >= 'v1.3' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:data' && (
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
                {controllerProps.record && queryVersion() >= 'v1.1' && (
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
