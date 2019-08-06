import React from 'react';
import {
    Datagrid,
    Title,
    ChipField,
    ShowController,
    ShowView,
    ReferenceManyField,
    ReferenceArrayField,
    SingleFieldList,
    ListButton,
    FunctionField,
    TextField,
    ArrayField,
    ReferenceField,
    UrlField,
    ShowButton,
    SimpleShowLayout,
    Button,
} from 'react-admin';
import {
    CardActions,
    Card,
    CardContent,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@material-ui/core';
import get from 'lodash/get';
import Cookies from 'universal-cookie';
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import VersionField from '../components/VersionField';
import MapTags from '../components/TagsField';
import '../index.css';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

export class DevicesList extends React.Component {
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
        var params = {
            filter: {},
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'id', order: 'DESC' },
        };
        var dataObject = await dataProvider('GET_LIST', 'devices', params);
        this.setState({ data: dataObject });
    }

    async nextPage(label) {
        var dataObject = await dataProvider(label, 'devices');
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
        var params = {
            filter: this.filterObject,
        };
        var dataObject = await dataProvider('GET_LIST', 'devices', params);
        this.setState({ data: dataObject });
    }

    render() {
        if (this.state.data.data) {
            return (
                <Card>
                    <Title title={'Devices'} />
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
                                    <TableCell style={{ minWidth: '240px' }}>
                                        Type{' '}
                                        <FilterField
                                            name="type"
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
                                                basePath="/devices"
                                                record={item}
                                                label={item.label}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.type}
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
            return <div></div>;
        }
    }
}

const DevicesTitle = ({ record }) => {
    return (
        <span>
            Device:
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

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
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

const ItemArrayField = ({ className, source, record = {}, reference, t }) => (
    <div style={{ fontSize: '14px' }}>
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

export const DevicesShow = props => (
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
                    <VersionField label="Version" source="version" />
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
                    <TextField source="type" />
                    {controllerProps.record && QueryVersion !== 'v1.0' && (
                        <ArrayField source="controls">
                            <Datagrid>
                                <UrlField source="href" />
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
                        label="Receivers"
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
                        label="Senders"
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
