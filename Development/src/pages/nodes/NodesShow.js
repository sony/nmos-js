import React from 'react';
import { CardActions } from '@material-ui/core';
import {
    ArrayField,
    Button,
    ChipField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceManyField,
    ShowController,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
} from 'react-admin';
import Cookies from 'universal-cookie';
import ExternalLinkIcon from '@material-ui/core/SvgIcon/SvgIcon';
import ItemArrayField from '../../components/ItemArrayField';
import JsonIcon from '../../components/JsonIcon';
import MapTags from '../../components/TagsField';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
import QueryVersion from '../../components/QueryVersion';

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

function buildLink(record) {
    return record.protocol + '://' + record.host + ':' + record.port;
}

const NodesShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<NodesTitle />} style={cardActionStyle}>
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

export const NodesShow = props => (
    <ShowController {...props}>
        {controllerProps => (
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
                        <ArrayField
                            label=" API Endpoints"
                            source="api.endpoints"
                        >
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
                                            <ExternalLinkIcon
                                                style={{
                                                    color: '#2196f3',
                                                    preserveAspectRatio:
                                                        'xMidYMin',
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
                                <TextField
                                    source="chassis_id"
                                    label="Chassis ID"
                                />
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
        )}
    </ShowController>
);

export default NodesShow;
