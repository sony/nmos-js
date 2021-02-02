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

const MQTTReceiver = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <MQTTReceiverLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const MQTTReceiverLeg = ({ data }) => {
    const params_ext = Object.keys(data).filter(x => x.startsWith('ext_'));
    return (
        <Card elevation={3}>
            <CardContent>
                <SimpleShowLayout record={data}>
                    {has(data, 'source_host') && (
                        <TextField source="source_host" label="Source Host" />
                    )}
                    {has(data, 'source_port') && (
                        <TextField source="source_port" label="Source Port" />
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

const MQTTReceiverEdit = ({ record }) => {
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
                {uniqueKeys.includes('source_host') && (
                    <TextInput source="source_host" label="Source Host" />
                )}
                {uniqueKeys.includes('source_port') && (
                    <TextInput source="source_port" label="Source Port" />
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

const RTPReceiver = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <RTPReceiverLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const RTPReceiverLeg = ({ data }) => {
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
                    {has(data, 'multicast_ip') && (
                        <TextField source="multicast_ip" label="Multicast IP" />
                    )}
                    {has(data, 'interface_ip') && (
                        <TextField source="interface_ip" label="Interface IP" />
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
                    {has(data, 'fec_mode') && (
                        <TextField source="fec_mode" label="FEC Mode" />
                    )}
                    {has(data, 'fec_destination_ip') && (
                        <TextField
                            source="fec_destination_ip"
                            label="FEC Destination IP"
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

const RTPReceiverEdit = ({ record }) => {
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
                {uniqueKeys.includes('multicast_ip') && (
                    <TextInput source="multicast_ip" label="Multicast IP" />
                )}
                {uniqueKeys.includes('interface_ip') && (
                    <TextInput source="interface_ip" label="Interface IP" />
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
                {uniqueKeys.includes('fec_mode') && (
                    <TextInput source="fec_mode" label="FEC Mode" />
                )}
                {uniqueKeys.includes('fec_destination_ip') && (
                    <TextInput
                        source="fec_destination_ip"
                        label="FEC Destination IP"
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

const WebSocketReceiver = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <WebSocketReceiverLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const WebSocketReceiverLeg = ({ data }) => {
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

const WebSocketReceiverEdit = ({ record }) => {
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

const ReceiverTransportParamsCardsGrid = ({ ids, record }) => {
    const type = get(record, '$transporttype');
    const data = [];
    if (ids) {
        for (let i in ids) {
            data.push(JSON.parse(ids[i]));
        }
        switch (type) {
            case 'urn:x-nmos:transport:mqtt':
                return <MQTTReceiver data={data} />;
            case 'urn:x-nmos:transport:rtp':
                return <RTPReceiver data={data} />;
            case 'urn:x-nmos:transport:websocket':
                return <WebSocketReceiver data={data} />;
            default:
                return <b>Unknown Type</b>;
        }
    } else {
        switch (type) {
            case 'urn:x-nmos:transport:mqtt':
                return <MQTTReceiverEdit record={record} />;
            case 'urn:x-nmos:transport:rtp':
                return <RTPReceiverEdit record={record} />;
            case 'urn:x-nmos:transport:websocket':
                return <WebSocketReceiverEdit record={record} />;
            default:
                return <b>Unknown Type</b>;
        }
    }
};

export default ReceiverTransportParamsCardsGrid;
