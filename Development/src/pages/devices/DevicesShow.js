import React from 'react';
import {
    ArrayField,
    Button,
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
import Cookies from 'universal-cookie';
import JsonIcon from '../../icons/JsonIcon';
import MapTags from '../../components/TagsField';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
import QueryVersion from '../../components/QueryVersion';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';

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

const DevicesShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<DevicesTitle />}>
        {data ? (
            <Button
                label={'Raw'}
                onClick={() =>
                    window.open(
                        cookies.get('Query API') +
                            '/' +
                            resource +
                            '/' +
                            data.id,
                        '_blank'
                    )
                }
                rel="noopener noreferrer"
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

const DevicesShow = props => {
    const controllerProps = useShowController(props);
    return (
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
                    link="show"
                >
                    <ChipConditionalLabel source="label" />
                </ReferenceField>
                <ReferenceArrayField source="receivers" reference="receivers">
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceArrayField>
                <ReferenceArrayField source="senders" reference="senders">
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceArrayField>
                <ReferenceManyField
                    label="Sources"
                    reference="sources"
                    target="device_id"
                >
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceManyField>
                <ReferenceManyField
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
    );
};

export default DevicesShow;
