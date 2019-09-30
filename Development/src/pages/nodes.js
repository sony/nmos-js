import React from 'react';
import {
    ArrayField,
    Button,
    ChipField,
    Datagrid,
    FunctionField,
    ListButton,
    ReferenceManyField,
    ShowButton,
    ShowController,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    Title,
    UrlField,
} from 'react-admin';
import {
    Card,
    CardActions,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';

import get from 'lodash/get';
import Cookies from 'universal-cookie';
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import VersionField from '../components/VersionField';
import MapTags from '../components/TagsField';
import ExternalLinkIcon from '@material-ui/icons/OpenInNew';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

export class NodesList extends React.Component {
    constructor(props) {
        super(props);
        this.filter = '';
        this.filterObject = {};
        this.state = {
            data: [],
        };
        this.nextPage = this.nextPage.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.filterPage = this.filterPage.bind(this);
        this.firstLoad = this.firstLoad.bind(this);
        this.firstLoad();
    }

    async firstLoad() {
        const params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'id', order: 'DESC' },
        };
        const dataObject = await dataProvider('GET_LIST', 'nodes', params);
        this.setState({ data: dataObject });
    }

    async nextPage(label) {
        const dataObject = await dataProvider(label, 'nodes');
        this.setState({ data: dataObject });
    }

    setFilter(filterValue, name) {
        if (filterValue) {
            this.filterObject[name] = filterValue;
        } else {
            delete this.filterObject[name];
        }
        this.filterPage();
    }

    async filterPage() {
        const params = {
            filter: this.filterObject,
        };
        const dataObject = await dataProvider('GET_LIST', 'nodes', params);
        this.setState({ data: dataObject });
    }

    copyField(data) {
        const el = document.createElement('textarea');
        el.value = data;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    render() {
        if (this.state.data.data) {
            return (
                <Card>
                    <Title title={'Nodes'} />
                    <CardContent>
                        <Button
                            label={'Raw'}
                            href={this.state.data.url}
                            style={{ float: 'right' }}
                            title={'View raw'}
                        >
                            <JsonIcon />
                        </Button>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        style={{
                                            minWidth: '240px',
                                            paddingLeft: '32px',
                                        }}
                                    >
                                        Label{' '}
                                        <FilterField
                                            name="label"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    <TableCell style={{ minWidth: '265px' }}>
                                        Hostname{' '}
                                        <FilterField
                                            name="hostname"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    {QueryVersion() >= 'v1.1' && (
                                        <TableCell
                                            style={{ minWidth: '280px' }}
                                        >
                                            API Versions{' '}
                                            <FilterField
                                                name="api.versions"
                                                setFilter={this.setFilter}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell style={{ minWidth: '255px' }}>
                                        Node ID{' '}
                                        <FilterField
                                            name="id"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {this.state.data.data.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell component="th" scope="row">
                                            <ShowButton
                                                style={{
                                                    textTransform: 'none',
                                                }}
                                                basePath="/nodes"
                                                record={item}
                                                label={item.label}
                                            />
                                        </TableCell>
                                        <TableCell>{item.hostname}</TableCell>
                                        {QueryVersion() >= 'v1.1' && (
                                            <TableCell>
                                                {item.api.versions.join(', ')}
                                            </TableCell>
                                        )}
                                        <TableCell
                                            onDoubleClick={() =>
                                                this.copyField(item.id)
                                            }
                                        >
                                            {item.id}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <br />
                        <PaginationButton
                            label="FIRST"
                            nextPage={this.nextPage}
                        />
                        <PaginationButton
                            label="PREV"
                            nextPage={this.nextPage}
                        />
                        <PaginationButton
                            label="NEXT"
                            nextPage={this.nextPage}
                        />
                        <PaginationButton
                            label="LAST"
                            nextPage={this.nextPage}
                        />
                    </CardContent>
                </Card>
            );
        } else {
            return (
                <div>
                    <p>Waiting for data...</p>
                </div>
            );
        }
    }
}

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

const ItemArrayField = ({ className, source, record = {} }) => (
    <div>
        {get(record, source).map(item => (
            <div key={item} className={className}>
                {item}
            </div>
        ))}
    </div>
);

ItemArrayField.defaultProps = {
    addLabel: true,
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

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
};

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
                    <VersionField source="version" />
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
                                <TextField source="ref_type" />
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
        )}
    </ShowController>
);
