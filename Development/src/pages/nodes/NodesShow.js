import React from 'react';
import {
    ArrayField,
    BooleanField,
    FunctionField,
    ReferenceManyField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    useShowController,
} from 'react-admin';
import LinkIcon from '@material-ui/icons/Link';
import LinkChipField from '../../components/LinkChipField';
import ItemArrayField from '../../components/ItemArrayField';
import ObjectField from '../../components/ObjectField';
import { TAGS } from '../../components/ParameterRegisters';
import ResourceShowActions from '../../components/ResourceShowActions';
import ResourceTitle from '../../components/ResourceTitle';
import TAIField from '../../components/TAIField';
import SanitizedDivider from '../../components/SanitizedDivider';
import UnsortableDatagrid from '../../components/UnsortableDatagrid';
import UrlField from '../../components/URLField';
import { queryVersion } from '../../settings';

function buildLink(record) {
    return record.protocol + '://' + record.host + ':' + record.port;
}

export const NodesShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <NodesShowView {...props} />
        </ShowContextProvider>
    );
};

const NodesShowView = props => {
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
                    <ObjectField register={TAGS} source="tags" />
                )}
                <SanitizedDivider />
                <UrlField source="href" label="Address" />
                <TextField source="hostname" />
                {queryVersion() >= 'v1.1' && (
                    <ItemArrayField
                        label="API Versions"
                        source="api.versions"
                    />
                )}
                {queryVersion() >= 'v1.1' && (
                    <ArrayField label="API Endpoints" source="api.endpoints">
                        <UnsortableDatagrid>
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
                                            color="primary"
                                            fontSize="small"
                                        />
                                    </a>
                                )}
                            />
                        </UnsortableDatagrid>
                    </ArrayField>
                )}
                {queryVersion() >= 'v1.1' && (
                    <ArrayField source="clocks">
                        <UnsortableDatagrid>
                            <TextField source="name" />
                            <TextField label="Ref Type" source="ref_type" />
                        </UnsortableDatagrid>
                    </ArrayField>
                )}
                <ArrayField source="services">
                    <UnsortableDatagrid>
                        <UrlField source="href" label="Address" />
                        <TextField source="type" />
                        {queryVersion() >= 'v1.3' && (
                            <BooleanField source="authorization" />
                        )}
                    </UnsortableDatagrid>
                </ArrayField>
                {queryVersion() >= 'v1.2' && (
                    <ArrayField source="interfaces">
                        <UnsortableDatagrid>
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
                        </UnsortableDatagrid>
                    </ArrayField>
                )}
                <SanitizedDivider />
                <ReferenceManyField
                    label="Devices"
                    reference="devices"
                    target="node_id"
                    foo="show"
                >
                    <SingleFieldList linkType="show">
                        <LinkChipField />
                    </SingleFieldList>
                </ReferenceManyField>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default NodesShow;
