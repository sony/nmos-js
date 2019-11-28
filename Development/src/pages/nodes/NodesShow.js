import React from 'react';
import {
    ArrayField,
    Button,
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
import Cookies from 'universal-cookie';
import LinkIcon from '@material-ui/icons/Link';
import ItemArrayField from '../../components/ItemArrayField';
import JsonIcon from '../../components/JsonIcon';
import MapTags from '../../components/TagsField';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
import QueryVersion from '../../components/QueryVersion';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';

const cookies = new Cookies();

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
                <UrlField source="href" label="Address" />
                <TextField source="hostname" />
                {controllerProps.record && QueryVersion() >= 'v1.1' && (
                    <ItemArrayField
                        label="API Versions"
                        source="api.versions"
                    />
                )}
                {controllerProps.record && QueryVersion() >= 'v1.1' && (
                    <ArrayField label="API Endpoints" source="api.endpoints">
                        <Datagrid>
                            <TextField source="host" />
                            <TextField source="port" />
                            <TextField source="protocol" />
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
                {controllerProps.record && QueryVersion() >= 'v1.1' && (
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
                    </Datagrid>
                </ArrayField>
                {controllerProps.record && QueryVersion() >= 'v1.2' && (
                    <ArrayField source="interfaces">
                        <Datagrid>
                            <TextField source="chassis_id" label="Chassis ID" />
                            <TextField source="name" />
                            <TextField source="port_id" label="Port ID" />
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
