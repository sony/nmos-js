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

const SourcesShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<SourcesTitle />} style={cardActionStyle}>
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

const SourcesShow = props => (
    <ShowController {...props}>
        {controllerProps => (
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
                    <hr />
                    <ReferenceArrayField
                        allowEmpty={true}
                        clickable="true"
                        label="Parents"
                        source="parents"
                        reference="sources"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    <ReferenceField
                        label="Device"
                        source="device_id"
                        reference="devices"
                        linkType="show"
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
        )}
    </ShowController>
);

export default SourcesShow;
