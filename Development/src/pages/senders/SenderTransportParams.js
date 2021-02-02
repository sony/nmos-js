import React from 'react';
import { Card, CardContent, Grid } from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import {
    ArrayInput,
    BooleanField,
    BooleanInput,
    SelectField,
    SelectInput,
    SimpleShowLayout,
    TextField,
    TextInput,
} from 'react-admin';
import { get, has } from 'lodash';
import CardFormIterator from '../../components/CardFormIterator';
import SanitizedDivider from '../../components/SanitizedDivider';
import labelize from '../../components/labelize';

const MQTTSender = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <MQTTSenderLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const MQTTSenderLeg = ({ data }) => {
    const params_ext = Object.keys(data).filter(x => x.startsWith('ext_'));
    return (
        <Card elevation={3}>
            <CardContent>
                <SimpleShowLayout record={data}>
                    {has(data, 'destination_host') && (
                        <TextField
                            source="destination_host"
                            label="Destination Host"
                        />
                    )}
                    {has(data, 'destination_port') && (
                        <TextField
                            source="destination_port"
                            label="Destination Port"
                        />
                    )}
                    {has(data, 'broker_protocol') && (
                        <TextField
                            source="broker_protocol"
                            label="Broker Protocol"
                        />
                    )}
                    {has(data, 'broker_authorization') && (
                        <SelectField
                            source="broker_authorization"
                            label="Broker Authorization"
                            choices={[
                                {
                                    id: true,
                                    name: <CheckIcon />,
                                },
                                {
                                    id: false,
                                    name: <ClearIcon />,
                                },
                                { id: 'auto', name: 'auto' },
                            ]}
                            translateChoice={false}
                        />
                    )}
                    {has(data, 'broker_topic') && (
                        <TextField source="broker_topic" label="Broker Topic" />
                    )}
                    {has(data, 'connection_status_broker_topic') && (
                        <TextField
                            source="connection_status_broker_topic"
                            label="Connection Status Broker Topic"
                        />
                    )}
                    {params_ext.length !== 0 && <SanitizedDivider />}
                    {params_ext.map(param => (
                        <TextField
                            source={param}
                            label={labelize(param)}
                            key={param}
                        />
                    ))}
                </SimpleShowLayout>
            </CardContent>
        </Card>
    );
};

const MQTTSenderEdit = ({ record }) => {
    const data = get(record, '$staged.transport_params');
    const uniqueKeys = Object.keys(
        data.reduce((result, obj) => Object.assign(result, obj), {})
    );
    const params_ext = uniqueKeys.filter(x => x.startsWith('ext_'));
    return (
        <ArrayInput
            label="Transport Parameters"
            source="$staged.transport_params"
        >
            <CardFormIterator disableRemove disableAdd>
                {uniqueKeys.includes('destination_host') && (
                    <TextInput
                        source="destination_host"
                        label="Destination Host"
                    />
                )}
                {uniqueKeys.includes('destination_port') && (
                    <TextInput
                        source="destination_port"
                        label="Destination Port"
                    />
                )}
                {uniqueKeys.includes('broker_protocol') && (
                    <TextInput
                        source="broker_protocol"
                        label="Broker Protocol"
                    />
                )}
                {uniqueKeys.includes('broker_authorization') && (
                    <SelectInput
                        source="broker_authorization"
                        label="Broker Authorization"
                        choices={[
                            { id: true, name: <CheckIcon /> },
                            { id: false, name: <ClearIcon /> },
                            { id: 'auto', name: 'auto' },
                        ]}
                        translateChoice={false}
                    />
                )}
                {uniqueKeys.includes('broker_topic') && (
                    <TextInput source="broker_topic" label="Broker Topic" />
                )}
                {uniqueKeys.includes('connection_status_broker_topic') && (
                    <TextInput
                        source="connection_status_broker_topic"
                        label="Connection Status Broker Topic"
                    />
                )}
                {params_ext.length !== 0 && <SanitizedDivider />}
                {params_ext.map(param => (
                    <TextInput
                        source={param}
                        label={labelize(param)}
                        key={param}
                    />
                ))}
            </CardFormIterator>
        </ArrayInput>
    );
};

const RTPSender = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <RTPSenderLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const RTPSenderLeg = ({ data }) => {
    const params_ext = Object.keys(data).filter(x => x.startsWith('ext_'));
    return (
        <Card elevation={3}>
            <CardContent>
                <SimpleShowLayout record={data}>
                    {has(data, 'rtp_enabled') && (
                        <BooleanField
                            source="rtp_enabled"
                            label="RTP Enabled"
                        />
                    )}
                    {has(data, 'source_ip') && (
                        <TextField source="source_ip" label="Source IP" />
                    )}
                    {has(data, 'destination_ip') && (
                        <TextField
                            source="destination_ip"
                            label="Destination IP"
                        />
                    )}
                    {has(data, 'source_port') && (
                        <TextField source="source_port" label="Source Port" />
                    )}
                    {has(data, 'destination_port') && (
                        <TextField
                            source="destination_port"
                            label="Destination Port"
                        />
                    )}
                    {has(data, 'fec_enabled') && <SanitizedDivider /> && (
                        <BooleanField
                            source="fec_enabled"
                            label="FEC Enabled"
                        />
                    )}
                    {has(data, 'fec_destination_ip') && (
                        <TextField
                            source="fec_destination_ip"
                            label="FEC Destination IP"
                        />
                    )}
                    {has(data, 'fec_type') && (
                        <TextField source="fec_type" label="FEC Type" />
                    )}
                    {has(data, 'fec_mode') && (
                        <TextField source="fec_mode" label="FEC Mode" />
                    )}
                    {has(data, 'fec_block_width') && (
                        <TextField
                            source="fec_block_width"
                            label="FEC Block Width"
                        />
                    )}
                    {has(data, 'fec_block_height') && (
                        <TextField
                            source="fec_block_height"
                            label="FEC Block Height"
                        />
                    )}
                    {has(data, 'fec1D_destination_port') && (
                        <TextField
                            source="fec1D_destination_port"
                            label="FEC1D Destination Port"
                        />
                    )}
                    {has(data, 'fec2D_destination_port') && (
                        <TextField
                            source="fec2D_destination_port"
                            label="FEC2D Destination Port"
                        />
                    )}
                    {has(data, 'fec1D_source_port') && (
                        <TextField
                            source="fec1D_source_port"
                            label="FEC1D source Port"
                        />
                    )}
                    {has(data, 'fec2D_source_port') && (
                        <TextField
                            source="fec2D_source_port"
                            label="FEC2D Source Port"
                        />
                    )}
                    {has(data, 'rtcp_enabled') && <SanitizedDivider /> && (
                        <BooleanField
                            source="rtcp_enabled"
                            label="RTCP Enabled"
                        />
                    )}
                    {has(data, 'rtcp_destination_ip') && (
                        <TextField
                            source="rtcp_destination_ip"
                            label="RTCP Destination IP"
                        />
                    )}
                    {has(data, 'rtcp_destination_port') && (
                        <TextField
                            source="rtcp_destination_port"
                            label="RTCP Destination Port"
                        />
                    )}
                    {has(data, 'rtcp_source_port') && (
                        <TextField
                            source="rtcp_source_port"
                            label="RTCP Source Port"
                        />
                    )}
                    {params_ext.length !== 0 && <SanitizedDivider />}
                    {params_ext.map(param => (
                        <TextField
                            source={param}
                            label={labelize(param)}
                            key={param}
                        />
                    ))}
                </SimpleShowLayout>
            </CardContent>
        </Card>
    );
};

const RTPSenderEdit = ({ record }) => {
    const data = get(record, '$staged.transport_params');
    const uniqueKeys = Object.keys(
        data.reduce((result, obj) => Object.assign(result, obj), {})
    );
    const params_ext = uniqueKeys.filter(x => x.startsWith('ext_'));
    return (
        <ArrayInput
            label="Transport Parameters"
            source="$staged.transport_params"
        >
            <CardFormIterator disableRemove disableAdd>
                {uniqueKeys.includes('rtp_enabled') && (
                    <BooleanInput source="rtp_enabled" label="RTP Enabled" />
                )}
                {uniqueKeys.includes('source_ip') && (
                    <TextInput source="source_ip" label="Source IP" />
                )}
                {uniqueKeys.includes('destination_ip') && (
                    <TextInput source="destination_ip" label="Destination IP" />
                )}
                {uniqueKeys.includes('source_port') && (
                    <TextInput source="source_port" label="Source Port" />
                )}
                {uniqueKeys.includes('destination_port') && (
                    <TextInput
                        source="destination_port"
                        label="Destination Port"
                    />
                )}
                {uniqueKeys.includes('fec_enabled') && (
                    <BooleanInput source="fec_enabled" label="FEC Enabled" />
                )}
                {uniqueKeys.includes('fec_destination_ip') && (
                    <TextInput
                        source="fec_destination_ip"
                        label="FEC Destination IP"
                    />
                )}
                {uniqueKeys.includes('fec_type') && (
                    <TextInput source="fec_type" label="FEC Type" />
                )}
                {uniqueKeys.includes('fec_mode') && (
                    <TextInput source="fec_mode" label="FEC Mode" />
                )}
                {uniqueKeys.includes('fec_block_width') && (
                    <TextInput
                        source="fec_block_width"
                        label="FEC Block Width"
                    />
                )}
                {uniqueKeys.includes('fec_block_height') && (
                    <TextInput
                        source="fec_block_height"
                        label="FEC Block Height"
                    />
                )}
                {uniqueKeys.includes('fec1D_destination_port') && (
                    <TextInput
                        source="fec1D_destination_port"
                        label="FEC1D Destination Port"
                    />
                )}
                {uniqueKeys.includes('fec2D_destination_port') && (
                    <TextInput
                        source="fec2D_destination_port"
                        label="FEC2D Destination Port"
                    />
                )}
                {uniqueKeys.includes('fec1D_source_port') && (
                    <TextInput
                        source="fec1D_source_port"
                        label="FEC1D Source Port"
                    />
                )}
                {uniqueKeys.includes('fec2D_source_port') && (
                    <TextInput
                        source="fec2D_source_port"
                        label="FEC2D Source Port"
                    />
                )}
                {uniqueKeys.includes('rtcp_enabled') && (
                    <BooleanInput source="rtcp_enabled" label="RTCP Enabled" />
                )}
                {uniqueKeys.includes('rtcp_destination_ip') && (
                    <TextInput
                        source="rtcp_destination_ip"
                        label="RTCP Destination IP"
                    />
                )}
                {uniqueKeys.includes('rtcp_destination_port') && (
                    <TextInput
                        source="rtcp_destination_port"
                        label="RTCP Destination Port"
                    />
                )}
                {uniqueKeys.includes('rtcp_source_port') && (
                    <TextInput
                        source="rtcp_source_port"
                        label="RTCP Source Port"
                    />
                )}
                {params_ext.length !== 0 && <SanitizedDivider />}
                {params_ext.map(param => (
                    <TextInput
                        source={param}
                        label={labelize(param)}
                        key={param}
                    />
                ))}
            </CardFormIterator>
        </ArrayInput>
    );
};

const WebSocketSender = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <WebSocketSenderLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const WebSocketSenderLeg = ({ data }) => {
    const params_ext = Object.keys(data).filter(x => x.startsWith('ext_'));
    return (
        <Card elevation={3}>
            <CardContent>
                <SimpleShowLayout record={data}>
                    {has(data, 'connection_authorization') && (
                        <SelectField
                            source="connection_authorization"
                            label="Connection Authorization"
                            choices={[
                                {
                                    id: true,
                                    name: <CheckIcon />,
                                },
                                {
                                    id: false,
                                    name: <ClearIcon />,
                                },
                                { id: 'auto', name: 'auto' },
                            ]}
                            translateChoice={false}
                        />
                    )}
                    {has(data, 'connection_uri') && (
                        <TextField
                            source="connection_uri"
                            label="Connection URI"
                        />
                    )}
                    {params_ext.length !== 0 && <SanitizedDivider />}
                    {params_ext.map(param => (
                        <TextField
                            source={param}
                            label={labelize(param)}
                            key={param}
                        />
                    ))}
                </SimpleShowLayout>
            </CardContent>
        </Card>
    );
};

const WebSocketSenderEdit = ({ record }) => {
    const data = get(record, '$staged.transport_params');
    const uniqueKeys = Object.keys(
        data.reduce((result, obj) => Object.assign(result, obj), {})
    );
    const params_ext = uniqueKeys.filter(x => x.startsWith('ext_'));
    return (
        <ArrayInput
            label="Transport Parameters"
            source="$staged.transport_params"
        >
            <CardFormIterator disableRemove disableAdd>
                {uniqueKeys.includes('connection_authorization') && (
                    <SelectInput
                        source="connection_authorization"
                        label="Connection Authorization"
                        choices={[
                            { id: true, name: <CheckIcon /> },
                            { id: false, name: <ClearIcon /> },
                            { id: 'auto', name: 'auto' },
                        ]}
                        translateChoice={false}
                    />
                )}
                {uniqueKeys.includes('connection_uri') && (
                    <TextInput source="connection_uri" label="Connection URI" />
                )}
                {params_ext.length !== 0 && <SanitizedDivider />}
                {params_ext.map(param => (
                    <TextInput
                        source={param}
                        label={labelize(param)}
                        key={param}
                    />
                ))}
            </CardFormIterator>
        </ArrayInput>
    );
};

const SenderTransportParamsCardsGrid = ({ ids, record }) => {
    const type = get(record, '$transporttype');
    const data = [];
    if (ids) {
        for (let i in ids) {
            data.push(JSON.parse(ids[i]));
        }
        switch (type) {
            case 'urn:x-nmos:transport:mqtt':
                return <MQTTSender data={data} />;
            case 'urn:x-nmos:transport:rtp':
                return <RTPSender data={data} />;
            case 'urn:x-nmos:transport:websocket':
                return <WebSocketSender data={data} />;
            default:
                return <b>Unknown Type</b>;
        }
    } else {
        switch (type) {
            case 'urn:x-nmos:transport:mqtt':
                return <MQTTSenderEdit record={record} />;
            case 'urn:x-nmos:transport:rtp':
                return <RTPSenderEdit record={record} />;
            case 'urn:x-nmos:transport:websocket':
                return <WebSocketSenderEdit record={record} />;
            default:
                return <b>Unknown Type</b>;
        }
    }
};

export default SenderTransportParamsCardsGrid;
