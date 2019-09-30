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
    UrlField,
} from 'react-admin';
import { hr } from '@material-ui/core';
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
import TAIField from '../components/TAIField';
import MapTags from '../components/TagsField';
import get from 'lodash/get';
import JsonIcon from '../components/JsonIcon';

const cookies = new Cookies();

export class SendersList extends React.Component {
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
        const dataObject = await dataProvider('GET_LIST', 'senders', params);
        this.setState({ data: dataObject });
    }

    async nextPage(label) {
        const dataObject = await dataProvider(label, 'senders');
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
        const dataObject = await dataProvider('GET_LIST', 'senders', params);
        this.setState({ data: dataObject });
    }

    render() {
        if (this.state.data.data) {
            return (
                <Card>
                    <Title title={'Senders'} />
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
                                                basePath="/senders"
                                                record={item}
                                                label={item.label}
                                            />
                                        </TableCell>
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

const SendersTitle = ({ record }) => {
    return (
        <span>
            Sender:{' '}
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

const SendersShowActions = ({ basePath, data, resource }) => (
    <CardActions title={<SendersTitle />} style={cardActionStyle}>
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

export const SendersShow = props => (
    <ShowController {...props}>
        {controllerProps => (
            <ShowView
                {...props}
                {...controllerProps}
                title={<SendersTitle />}
                actions={<SendersShowActions />}
            >
                <SimpleShowLayout>
                    <TextField label="ID" source="id" />
                    <TAIField source="version" />
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
                    <UrlField
                        style={{ fontSize: '14px' }}
                        label="Manifest Address"
                        source="manifest_href"
                    />
                    {controllerProps.record && QueryVersion() >= 'v1.2' && (
                        <ItemArrayField source="interface_bindings" />
                    )}
                    {controllerProps.record && QueryVersion() >= 'v1.2' && (
                        <BooleanField
                            label="Subscription Active"
                            source="subscription.active"
                        />
                    )}
                    <hr />
                    <ReferenceField
                        label="Flow"
                        source="flow_id"
                        reference="flows"
                        linkType="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                    <ReferenceField
                        label="Device"
                        source="device_id"
                        reference="devices"
                        linkType="show"
                    >
                        <ChipConditionalLabel source="label" />
                    </ReferenceField>
                    {controllerProps.record &&
                        QueryVersion() >= 'v1.2' &&
                        controllerProps.record.subscription.receiver_id && (
                            <ReferenceField
                                label="Receiver"
                                source="subscription.receiver_id"
                                reference="receivers"
                                linkType="show"
                            >
                                <ChipConditionalLabel source="label" />
                            </ReferenceField>
                        )}
                </SimpleShowLayout>
            </ShowView>
        )}
    </ShowController>
);
