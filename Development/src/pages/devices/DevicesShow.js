import React from 'react';
import {
    ArrayField,
    BooleanField,
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
    useShowController,
} from 'react-admin';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import MapObject from '../../components/ObjectField';
import ResourceShowActions from '../../components/ResourceShowActions';
import ResourceTitle from '../../components/ResourceTitle';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
import { queryVersion } from '../../settings';

export const DevicesShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <DevicesShowView {...props} />
        </ShowContextProvider>
    );
};

const DevicesShowView = props => {
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
                {queryVersion() >= 'v1.1' && <TextField source="description" />}
                {queryVersion() >= 'v1.1' && (
                    <FunctionField
                        label="Tags"
                        render={record =>
                            Object.keys(record.tags).length > 0
                                ? MapObject(record, 'tags')
                                : null
                        }
                    />
                )}
                <hr />
                <TextField source="type" />
                {queryVersion() >= 'v1.1' && (
                    <ArrayField source="controls">
                        <Datagrid>
                            <UrlField source="href" label="Address" />
                            <TextField source="type" />
                            {queryVersion() >= 'v1.3' && (
                                <BooleanField source="authorization" />
                            )}
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
