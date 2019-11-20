import React from 'react';
import { CardActions } from '@material-ui/core';
import {
    ArrayField,
    Button,
    ChipField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceArrayField,
    ReferenceField,
    ReferenceManyField,
    ShowController,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
} from 'react-admin';
import Cookies from 'universal-cookie';
import JsonIcon from '../../components/JsonIcon';
import MapTags from '../../components/TagsField';
import TAIField from '../../components/TAIField';
import QueryVersion from '../../components/QueryVersion';

const cookies = new Cookies();

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

const ChipConditionalLabel = ({ record, source, ...props }) => {
    props.clickable = true;
    return record ? (
        record[source] ? (
            <ChipField {...{ record, source, ...props }} />
        ) : (
            <ChipField {...{ record, source: 'id', ...props }} />
        )
    ) : null;
};

const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

const FlowsShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<FlowsTitle />} style={cardActionStyle}>
        {data ? (
            <Button
                label={'Raw'}
                href={cookies.get('Query API') + '/' + resource + '/' + data.id}
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </CardActions>
);

const FlowsShow = props => (
    <ShowController {...props}>
        {controllerProps => (
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
                                ? MapTags(record)
                                : null
                        }
                    />
                    <hr />
                    <TextField source="format" />
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <TextField label="Media Type" source="media_type" />
                    )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Frame Width"
                                source="frame_width"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Frame Height"
                                source="frame_height"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Interlace Mode"
                                source="interlace_mode"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField source="colorspace" />
                        )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.1' &&
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
                        QueryVersion() >= 'v1.1' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Transfer Characteristic"
                                source="transfer_characteristic"
                            />
                        )}
                    <hr />
                    <ReferenceArrayField
                        allowEmpty={true}
                        clickable="true"
                        label="Parents"
                        source="parents"
                        reference="flows"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <ReferenceField
                            label="Device"
                            source="device_id"
                            reference="devices"
                            linkType="show"
                        >
                            <ChipConditionalLabel source="label" />
                        </ReferenceField>
                    )}
                    <ReferenceField
                        label="Source"
                        source="source_id"
                        reference="sources"
                        linkType="show"
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
        )}
    </ShowController>
);

export default FlowsShow;
