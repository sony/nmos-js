import React from 'react';
import {
    Title,
    Datagrid,
    TextField,
    ShowController,
    ShowView,
    ReferenceArrayField,
    ReferenceField,
    SingleFieldList,
    ReferenceManyField,
    ChipField,
    ListButton,
    FunctionField,
    ArrayField,
    ShowButton,
    SimpleShowLayout,
} from 'react-admin';
import get from 'lodash/get';
import Cookies from 'universal-cookie';
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
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import VersionField from '../components/VersionField';
import MapTags from '../components/TagsField';

const cookies = new Cookies();

export class FlowsList extends React.Component {
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
        var dataObject = await dataProvider('GET_LIST', 'flows', params);
        this.setState({ data: dataObject });
    }

    async nextPage(label) {
        var dataObject = await dataProvider(label, 'flows');
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
        var dataObject = await dataProvider('GET_LIST', 'flows', params);
        this.setState({ data: dataObject });
    }
    render() {
        if (this.state.data.data) {
            return (
                <Card>
                    <Title title={'Flows'} />
                    <CardContent>
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
                                    <TableCell style={{ minWidth: '245px' }}>
                                        Format{' '}
                                        <FilterField
                                            name="format"
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
                                                basePath="/flows"
                                                record={item}
                                                label={item.label}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.format}
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

const FlowsTitle = ({ record }) => {
    return <span>Flow: {record ? record.label ? `${record.label}` : `${record.id}` : 'Unknown'}</span>;
};

const ItemArrayField = ({ className, source, record = {} }) => (
    <div>
        {get(record, source).map(item => (
            <div key={item} className={className}></div>
        ))}
    </div>
);

ItemArrayField.defaultProps = {
    addLabel: true,
};

const ChipConditionalLabel = ({ record, source, ...props }) => {
    props.clickable = true;
    return (
        record ? record[source] ? (
            <ChipField {...{ record, source, ...props }} />
        ) : (
            <ChipField {...{ record, source: 'id', ...props }} />
        ) : null
    );
};

const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
};

const FlowsShowActions = ({ basePath }) => (
    <CardActions title={<FlowsTitle />} style={cardActionStyle}>
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </CardActions>
);

export const FlowsShow = props => (
    <ShowController {...props}>
        {controllerProps => (
            <ShowView
                {...props}
                {...controllerProps}
                title={<FlowsTitle />}
                actions={<FlowsShowActions />}
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
                    <TextField source="format" />
                    {controllerProps.record && QueryVersion !== 'v1.0' && (
                        <TextField label="Media Types" source="media_type" />
                    )}
                    {controllerProps.record &&
                        QueryVersion !== 'v1.0' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Frame Width"
                                source="frame_width"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion !== 'v1.0' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Frame Height"
                                source="frame_height"
                            />
                        )}
                    {controllerProps.record &&
                        QueryVersion !== 'v1.0' &&
                        controllerProps.record.format ===
                            'urn:x-nmos:format:video' && (
                            <TextField
                                label="Interlace Mode"
                                source="interlace_mode"
                            />
                        )}
                    {controllerProps.record &&
                    QueryVersion !== 'v1.0' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' ? (
                        <TextField source="colorspace" />
                    ) : null}
                    {controllerProps.record &&
                    QueryVersion !== 'v1.0' &&
                    controllerProps.record.format ===
                        'urn:x-nmos:format:video' ? (
                        <ArrayField source="components">
                            <Datagrid>
                                <TextField source="name" />
                                <TextField source="height" />
                                <TextField source="width" />
                                <TextField source="bit_depth" />
                            </Datagrid>
                        </ArrayField>
                    ) : null}
                    <hr />
                    <ReferenceArrayField
                        allowEmpty={true}
                        clickable="true"
                        label="Parents"
                        source="parents"
                        reference="flows"
                        linkType="show"
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceArrayField>
                    {controllerProps.record &&
                        QueryVersion !== 'v1.0' && (
                            <TextField
                                label="Transfer Characteristic"
                                source="transfer_characteristic"
                            />
                        ) && (
                            <ReferenceField
                                label="Device"
                                source="device_id"
                                reference="devices"
                                linkType="show"
                            >
                                <ChipConditionalLabel source="label" />
                            </ReferenceField>
                        )}
                    <ReferenceField
                        label="Source"
                        source="source_id"
                        reference="sources"
                        linkType="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                    <hr />
                    <ReferenceManyField
                        label="Senders"
                        reference="senders"
                        target="flow_id"
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
