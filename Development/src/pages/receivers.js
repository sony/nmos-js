import React from 'react';
import {
    BooleanField,
    Button,
    ChipField,
    FunctionField,
    ListButton,
    ReferenceField,
    ShowButton,
    ShowController,
    ShowView,
    SimpleShowLayout,
    TextField,
    Title,
} from 'react-admin';
import { hr } from '@material-ui/core';
import get from 'lodash/get';
import Cookies from 'universal-cookie';
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
import dataProvider from '../dataProvider';
import PaginationButton from '../components/PaginationButton';
import FilterField from '../components/FilterField';
import VersionField from '../components/VersionField';
import MapTags from '../components/TagsField';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

export class ReceiversList extends React.Component {
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
        const dataObject = await dataProvider('GET_LIST', 'receivers', params);
        this.setState({ data: dataObject });
    }

    async nextPage(label) {
        const dataObject = await dataProvider(label, 'receivers');
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
        const dataObject = await dataProvider('GET_LIST', 'receivers', params);
        this.setState({ data: dataObject });
    }

    render() {
        if (this.state.data.data) {
            return (
                <Card>
                    <Title title={'Receivers'} />
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
                                    <TableCell style={{ minWidth: '245px' }}>
                                        Format{' '}
                                        <FilterField
                                            name="format"
                                            setFilter={this.setFilter}
                                        />
                                    </TableCell>
                                    <TableCell style={{ minWidth: '260px' }}>
                                        Transport{' '}
                                        <FilterField
                                            name="transport"
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
                                                basePath="/receivers"
                                                record={item}
                                                label={item.label}
                                            />
                                        </TableCell>
                                        <TableCell>{item.format}</TableCell>
                                        <TableCell>{item.transport}</TableCell>
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
            return <div />;
        }
    }
}

const ReceiversTitle = ({ record }) => {
    return (
        <span>
            Receiver:
            {record
                ? record.label
                    ? `${record.label}`
                    : `${record.id}`
                : 'Unknown'}
        </span>
    );
};

const ItemArrayField = ({ className, source, record = {} }) => (
    <div style={{ fontSize: '14px' }}>
        {get(record, source).map((item, i) => (
            <div key={i} className={className}>
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

const QueryVersion = () => {
    let url = cookies.get('Query API');
    return url.match(/([^/]+)(?=\/?$)/g)[0];
};

const ReceiversShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<ReceiversTitle />} style={cardActionStyle}>
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

export const ReceiversShow = props => (
    <ShowController {...props}>
        {controllerProps => (
            <ShowView
                {...props}
                {...controllerProps}
                title={<ReceiversTitle />}
                actions={<ReceiversShowActions />}
            >
                <SimpleShowLayout>
                    <TextField label="ID" source="id" />
                    <VersionField source="version" />
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
                    <TextField source="transport" />
                    {controllerProps.record && QueryVersion() >= 'v1.2' && (
                        <ItemArrayField
                            label="Interface Bindings"
                            source="interface_bindings"
                        />
                    )}
                    {controllerProps.record &&
                        controllerProps.record.caps.media_types && (
                            <ItemArrayField
                                label="Caps Media Types"
                                source="caps.media_types"
                            />
                        )}
                    {controllerProps.record &&
                        controllerProps.record.caps.event_types && (
                            <ItemArrayField
                                label="Caps Event Types"
                                source="caps.event_types"
                            />
                        )}
                    <TextField source="format" />
                    {controllerProps.record && QueryVersion() >= 'v1.2' && (
                        <BooleanField
                            label="Subscription Active"
                            source="subscription.active"
                        />
                    )}
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.2' &&
                        controllerProps.record.subscription.sender_id && (
                            <ReferenceField
                                label="Sender"
                                source="subscription.sender_id"
                                reference="senders"
                                linkType="show"
                            >
                                <ChipConditionalLabel source="label" />
                            </ReferenceField>
                        )}
                    <hr />
                    <ReferenceField
                        label="Device"
                        source="device_id"
                        reference="devices"
                        linkType="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                </SimpleShowLayout>
            </ShowView>
        )}
    </ShowController>
);
