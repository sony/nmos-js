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
import UrlField from '../../components/URLField';
import QueryVersion from '../../components/QueryVersion';

const cookies = new Cookies();

const DevicesTitle = ({ record }) => {
    return (
        <span>
            Device:{' '}
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

const DevicesShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<DevicesTitle />} style={cardActionStyle}>
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

const DevicesShow = props => (
    <ShowController {...props}>
        {controllerProps => (
            <ShowView
                {...props}
                {...controllerProps}
                title={<DevicesTitle />}
                actions={<DevicesShowActions />}
            >
                <SimpleShowLayout>
                    <TextField label="ID" source="id" />
                    <TAIField source="version" />
                    <TextField source="label" />
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <TextField source="description" />
                    )}
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <FunctionField
                            label="Tags"
                            render={record =>
                                Object.keys(record.tags).length > 0
                                    ? MapTags(record)
                                    : null
                            }
                        />
                    )}
                    <hr />
                    <TextField source="type" />
                    {controllerProps.record && QueryVersion() >= 'v1.1' && (
                        <ArrayField source="controls">
                            <Datagrid>
                                <UrlField source="href" label="Address" />
                                <TextField source="type" />
                            </Datagrid>
                        </ArrayField>
                    )}
                    <ReferenceField
                        label="Node"
                        source="node_id"
                        reference="nodes"
                        linkType="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                    <ReferenceArrayField
                        allowEmpty={true}
                        source="receivers"
                        reference="receivers"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    <ReferenceArrayField
                        allowEmpty={true}
                        clickable="true"
                        source="senders"
                        reference="senders"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    <hr />
                    <ReferenceManyField
                        clickable="true"
                        label="Receivers"
                        target="device_id"
                        reference="receivers"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                    <ReferenceManyField
                        clickable="true"
                        label="Senders"
                        target="device_id"
                        reference="senders"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                    <ReferenceManyField
                        clickable="true"
                        label="Sources"
                        reference="sources"
                        target="device_id"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                    <ReferenceManyField
                        clickable="true"
                        label="Flows"
                        reference="flows"
                        target="device_id"
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

export default DevicesShow;
