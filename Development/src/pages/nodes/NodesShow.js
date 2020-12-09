import React from 'react';
import {
    ArrayField,
    BooleanField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceManyField,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    TopToolbar,
    useShowController,
} from 'react-admin';
import LinkIcon from '@material-ui/icons/Link';
import ItemArrayField from '../../components/ItemArrayField';
import MapObject from '../../components/ObjectField';
import RawButton from '../../components/RawButton';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import { queryVersion } from '../../settings';

const NodesTitle = ({ record }) => {
    return (
        <span>
            Node:{' '}
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

function buildLink(record) {
    return record.protocol + '://' + record.host + ':' + record.port;
}

const NodesShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<NodesTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

export const NodesShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowView
            {...props}
            {...controllerProps}
            title={<NodesTitle />}
            actions={<NodesShowActions />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                <TAIField source="version" />
                <TextField source="label" />
                {controllerProps.record && queryVersion() >= 'v1.1' && (
                    <TextField source="description" />
                )}
                {controllerProps.record && queryVersion() >= 'v1.1' && (
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
                <UrlField source="href" label="Address" />
                <TextField source="hostname" />
                {controllerProps.record && queryVersion() >= 'v1.1' && (
                    <ItemArrayField
                        label="API Versions"
                        source="api.versions"
                    />
                )}
                {controllerProps.record && queryVersion() >= 'v1.1' && (
                    <ArrayField label="API Endpoints" source="api.endpoints">
                        <Datagrid>
                            <TextField source="host" />
                            <TextField source="port" />
                            <TextField source="protocol" />
                            {queryVersion() >= 'v1.3' && (
                                <BooleanField source="authorization" />
                            )}
                            <FunctionField
                                render={record => (
                                    <a
                                        href={buildLink(record)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <LinkIcon
                                            style={{
                                                color: '#2196f3',
                                                preserveAspectRatio: 'xMidYMin',
                                            }}
                                        />
                                    </a>
                                )}
                            />
                        </Datagrid>
                    </ArrayField>
                )}
                {controllerProps.record && queryVersion() >= 'v1.1' && (
                    <ArrayField source="clocks">
                        <Datagrid>
                            <TextField source="name" />
                            <TextField label="Ref Type" source="ref_type" />
                        </Datagrid>
                    </ArrayField>
                )}
                <ArrayField source="services">
                    <Datagrid>
                        <UrlField source="href" label="Address" />
                        <TextField source="type" />
                        {queryVersion() >= 'v1.3' && (
                            <BooleanField source="authorization" />
                        )}
                    </Datagrid>
                </ArrayField>
                {controllerProps.record && queryVersion() >= 'v1.2' && (
                    <ArrayField source="interfaces">
                        <Datagrid>
                            <TextField source="name" />
                            <TextField
                                source="chassis_id"
                                label="Local Chassis ID"
                            />
                            <TextField source="port_id" label="Local Port ID" />
                            {queryVersion() >= 'v1.3' && (
                                <TextField
                                    source="attached_network_device.chassis_id"
                                    label="Remote Chassis ID"
                                />
                            )}
                            {queryVersion() >= 'v1.3' && (
                                <TextField
                                    source="attached_network_device.port_id"
                                    label="Remote Port ID"
                                />
                            )}
                        </Datagrid>
                    </ArrayField>
                )}
                <hr />
                <ReferenceManyField
                    label="Devices"
                    reference="devices"
                    target="node_id"
                    foo="show"
                >
                    <SingleFieldList linkType="show">
                        <ChipConditionalLabel source="label" />
                    </SingleFieldList>
                </ReferenceManyField>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default NodesShow;
