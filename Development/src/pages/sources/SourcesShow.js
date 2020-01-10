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
import MapTags from '../../components/TagsField';
import RawButton from '../../components/RawButton';
import TAIField from '../../components/TAIField';
import QueryVersion from '../../components/QueryVersion';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';

const SourcesTitle = ({ record }) => {
    return (
        <span>
            Source:{' '}
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

const SourcesShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<SourcesTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

const SourcesShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<SourcesTitle />}
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
                            ? MapTags(record)
                            : null
                    }
                />
                <hr />
                {controllerProps.record && QueryVersion() >= 'v1.1' && (
                    <FunctionField
                        label="Grain Rate"
                        render={record =>
                            record.grain_rate
                                ? `${record.grain_rate.numerator} : ${
                                      record.grain_rate.denominator
                                          ? record.grain_rate.denominator
                                          : 1
                                  }`
                                : null
                        }
                    />
                )}
                {controllerProps.record && QueryVersion() >= 'v1.1' && (
                    <TextField label="Clock Name" source="clock_name" />
                )}
                <TextField source="format" />
                {controllerProps.record &&
                    QueryVersion() >= 'v1.1' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:audio' && (
                        <ArrayField source="channels">
                            <Datagrid>
                                <TextField source="label" />
                                <TextField source="symbol" />
                            </Datagrid>
                        </ArrayField>
                    )}
                {controllerProps.record &&
                    QueryVersion() >= 'v1.3' &&
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
