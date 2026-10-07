import React from 'react';
import { Card, Grid } from '@material-ui/core';
import { ArrayInput, SimpleShowLayout } from 'react-admin';
import { get, has } from 'lodash';
import CardFormIterator from '../../components/CardFormIterator';
import GenericTransportParamInput from '../../components/GenericTransportParamInput';
import TransportParamField from '../../components/TransportParamField';
import TransportParamInput from '../../components/TransportParamInput';
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
            <>
                <SimpleShowLayout record={data}>
                    {has(data, 'destination_host') && (
                        <TransportParamField
                            source="destination_host"
                            label="Destination Host"
                        />
                    )}
                    {has(data, 'destination_port') && (
                        <TransportParamField
                            source="destination_port"
                            label="Destination Port"
                        />
                    )}
                    {has(data, 'broker_protocol') && (
                        <TransportParamField
                            source="broker_protocol"
                            label="Broker Protocol"
                        />
                    )}
                    {has(data, 'broker_authorization') && (
                        <TransportParamField
                            source="broker_authorization"
                            label="Broker Authorization"
                        />
                    )}
                    {has(data, 'broker_topic') && (
                        <TransportParamField
                            source="broker_topic"
                            label="Broker Topic"
                        />
                    )}
                    {has(data, 'connection_status_broker_topic') && (
                        <TransportParamField
                            source="connection_status_broker_topic"
                            label="Connection Status Broker Topic"
                        />
                    )}
                    {params_ext.length !== 0 && <SanitizedDivider />}
                    {params_ext.map(param => (
                        <TransportParamField
                            source={param}
                            label={labelize(param)}
                            key={param}
                        />
                    ))}
                </SimpleShowLayout>
            </>
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
                    <TransportParamInput
                        source="destination_host"
                        label="Destination Host"
                        nullable
                        auto
                    />
                )}
                {uniqueKeys.includes('destination_port') && (
                    <TransportParamInput
                        source="destination_port"
                        label="Destination Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('broker_protocol') && (
                    <TransportParamInput
                        source="broker_protocol"
                        label="Broker Protocol"
                        kind="enum"
                        auto
                        choices={['mqtt', 'secure-mqtt']}
                    />
                )}
                {uniqueKeys.includes('broker_authorization') && (
                    <TransportParamInput
                        source="broker_authorization"
                        label="Broker Authorization"
                        kind="boolean"
                        auto
                    />
                )}
                {uniqueKeys.includes('broker_topic') && (
                    <TransportParamInput
                        source="broker_topic"
                        label="Broker Topic"
                        nullable
                    />
                )}
                {uniqueKeys.includes('connection_status_broker_topic') && (
                    <TransportParamInput
                        source="connection_status_broker_topic"
                        label="Connection Status Broker Topic"
                        nullable
                    />
                )}
                {params_ext.length !== 0 && <SanitizedDivider />}
                {params_ext.map(param => (
                    <GenericTransportParamInput
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
            <>
                <SimpleShowLayout record={data}>
                    {has(data, 'rtp_enabled') && (
                        <TransportParamField
                            source="rtp_enabled"
                            label="RTP Enabled"
                        />
                    )}
                    {has(data, 'source_ip') && (
                        <TransportParamField
                            source="source_ip"
                            label="Source IP"
                        />
                    )}
                    {has(data, 'destination_ip') && (
                        <TransportParamField
                            source="destination_ip"
                            label="Destination IP"
                        />
                    )}
                    {has(data, 'source_port') && (
                        <TransportParamField
                            source="source_port"
                            label="Source Port"
                        />
                    )}
                    {has(data, 'destination_port') && (
                        <TransportParamField
                            source="destination_port"
                            label="Destination Port"
                        />
                    )}
                    {has(data, 'fec_enabled') && <SanitizedDivider /> && (
                        <TransportParamField
                            source="fec_enabled"
                            label="FEC Enabled"
                        />
                    )}
                    {has(data, 'fec_destination_ip') && (
                        <TransportParamField
                            source="fec_destination_ip"
                            label="FEC Destination IP"
                        />
                    )}
                    {has(data, 'fec_type') && (
                        <TransportParamField
                            source="fec_type"
                            label="FEC Type"
                        />
                    )}
                    {has(data, 'fec_mode') && (
                        <TransportParamField
                            source="fec_mode"
                            label="FEC Mode"
                        />
                    )}
                    {has(data, 'fec_block_width') && (
                        <TransportParamField
                            source="fec_block_width"
                            label="FEC Block Width"
                        />
                    )}
                    {has(data, 'fec_block_height') && (
                        <TransportParamField
                            source="fec_block_height"
                            label="FEC Block Height"
                        />
                    )}
                    {has(data, 'fec1D_destination_port') && (
                        <TransportParamField
                            source="fec1D_destination_port"
                            label="FEC1D Destination Port"
                        />
                    )}
                    {has(data, 'fec2D_destination_port') && (
                        <TransportParamField
                            source="fec2D_destination_port"
                            label="FEC2D Destination Port"
                        />
                    )}
                    {has(data, 'fec1D_source_port') && (
                        <TransportParamField
                            source="fec1D_source_port"
                            label="FEC1D source Port"
                        />
                    )}
                    {has(data, 'fec2D_source_port') && (
                        <TransportParamField
                            source="fec2D_source_port"
                            label="FEC2D Source Port"
                        />
                    )}
                    {has(data, 'rtcp_enabled') && <SanitizedDivider /> && (
                        <TransportParamField
                            source="rtcp_enabled"
                            label="RTCP Enabled"
                        />
                    )}
                    {has(data, 'rtcp_destination_ip') && (
                        <TransportParamField
                            source="rtcp_destination_ip"
                            label="RTCP Destination IP"
                        />
                    )}
                    {has(data, 'rtcp_destination_port') && (
                        <TransportParamField
                            source="rtcp_destination_port"
                            label="RTCP Destination Port"
                        />
                    )}
                    {has(data, 'rtcp_source_port') && (
                        <TransportParamField
                            source="rtcp_source_port"
                            label="RTCP Source Port"
                        />
                    )}
                    {params_ext.length !== 0 && <SanitizedDivider />}
                    {params_ext.map(param => (
                        <TransportParamField
                            source={param}
                            label={labelize(param)}
                            key={param}
                        />
                    ))}
                </SimpleShowLayout>
            </>
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
                    <TransportParamInput
                        source="rtp_enabled"
                        label="RTP Enabled"
                        kind="boolean"
                    />
                )}
                {uniqueKeys.includes('source_ip') && (
                    <TransportParamInput
                        source="source_ip"
                        label="Source IP"
                        auto
                    />
                )}
                {uniqueKeys.includes('destination_ip') && (
                    <TransportParamInput
                        source="destination_ip"
                        label="Destination IP"
                        auto
                    />
                )}
                {uniqueKeys.includes('source_port') && (
                    <TransportParamInput
                        source="source_port"
                        label="Source Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('destination_port') && (
                    <TransportParamInput
                        source="destination_port"
                        label="Destination Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('fec_enabled') && (
                    <TransportParamInput
                        source="fec_enabled"
                        label="FEC Enabled"
                        kind="boolean"
                    />
                )}
                {uniqueKeys.includes('fec_destination_ip') && (
                    <TransportParamInput
                        source="fec_destination_ip"
                        label="FEC Destination IP"
                        auto
                    />
                )}
                {uniqueKeys.includes('fec_type') && (
                    <TransportParamInput
                        source="fec_type"
                        label="FEC Type"
                        kind="enum"
                        choices={['XOR', 'Reed-Solomon']}
                    />
                )}
                {uniqueKeys.includes('fec_mode') && (
                    <TransportParamInput
                        source="fec_mode"
                        label="FEC Mode"
                        kind="enum"
                        choices={['1D', '2D']}
                    />
                )}
                {uniqueKeys.includes('fec_block_width') && (
                    <TransportParamInput
                        source="fec_block_width"
                        label="FEC Block Width"
                        kind="integer"
                    />
                )}
                {uniqueKeys.includes('fec_block_height') && (
                    <TransportParamInput
                        source="fec_block_height"
                        label="FEC Block Height"
                        kind="integer"
                    />
                )}
                {uniqueKeys.includes('fec1D_destination_port') && (
                    <TransportParamInput
                        source="fec1D_destination_port"
                        label="FEC1D Destination Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('fec2D_destination_port') && (
                    <TransportParamInput
                        source="fec2D_destination_port"
                        label="FEC2D Destination Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('fec1D_source_port') && (
                    <TransportParamInput
                        source="fec1D_source_port"
                        label="FEC1D Source Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('fec2D_source_port') && (
                    <TransportParamInput
                        source="fec2D_source_port"
                        label="FEC2D Source Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('rtcp_enabled') && (
                    <TransportParamInput
                        source="rtcp_enabled"
                        label="RTCP Enabled"
                        kind="boolean"
                    />
                )}
                {uniqueKeys.includes('rtcp_destination_ip') && (
                    <TransportParamInput
                        source="rtcp_destination_ip"
                        label="RTCP Destination IP"
                        auto
                    />
                )}
                {uniqueKeys.includes('rtcp_destination_port') && (
                    <TransportParamInput
                        source="rtcp_destination_port"
                        label="RTCP Destination Port"
                        kind="integer"
                        auto
                    />
                )}
                {uniqueKeys.includes('rtcp_source_port') && (
                    <TransportParamInput
                        source="rtcp_source_port"
                        label="RTCP Source Port"
                        kind="integer"
                        auto
                    />
                )}
                {params_ext.length !== 0 && <SanitizedDivider />}
                {params_ext.map(param => (
                    <GenericTransportParamInput
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
            <>
                <SimpleShowLayout record={data}>
                    {has(data, 'connection_authorization') && (
                        <TransportParamField
                            source="connection_authorization"
                            label="Connection Authorization"
                        />
                    )}
                    {has(data, 'connection_uri') && (
                        <TransportParamField
                            source="connection_uri"
                            label="Connection URI"
                        />
                    )}
                    {params_ext.length !== 0 && <SanitizedDivider />}
                    {params_ext.map(param => (
                        <TransportParamField
                            source={param}
                            label={labelize(param)}
                            key={param}
                        />
                    ))}
                </SimpleShowLayout>
            </>
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
                    <TransportParamInput
                        source="connection_authorization"
                        label="Connection Authorization"
                        kind="boolean"
                        auto
                    />
                )}
                {uniqueKeys.includes('connection_uri') && (
                    <TransportParamInput
                        source="connection_uri"
                        label="Connection URI"
                        nullable
                        auto
                    />
                )}
                {params_ext.length !== 0 && <SanitizedDivider />}
                {params_ext.map(param => (
                    <GenericTransportParamInput
                        source={param}
                        label={labelize(param)}
                        key={param}
                    />
                ))}
            </CardFormIterator>
        </ArrayInput>
    );
};

const MXLSender = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <MXLSenderLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const MXLSenderLeg = ({ data }) => {
    const params_ext = Object.keys(data).filter(x => x.startsWith('ext_'));
    return (
        <Card elevation={3}>
            <>
                <SimpleShowLayout record={data}>
                    {has(data, 'mxl_domain_id') && (
                        <TransportParamField
                            source="mxl_domain_id"
                            label="MXL Domain ID"
                        />
                    )}
                    {has(data, 'mxl_flow_id') && (
                        <TransportParamField
                            source="mxl_flow_id"
                            label="MXL Flow ID"
                        />
                    )}
                    {params_ext.length !== 0 && <SanitizedDivider />}
                    {params_ext.map(param => (
                        <TransportParamField
                            source={param}
                            label={labelize(param)}
                            key={param}
                        />
                    ))}
                </SimpleShowLayout>
            </>
        </Card>
    );
};

const MXLSenderEdit = ({ record }) => {
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
                <TransportParamInput
                    source="mxl_domain_id"
                    label="MXL Domain ID"
                    nullable
                    auto
                />
                <TransportParamInput
                    source="mxl_flow_id"
                    label="MXL Flow ID"
                    nullable
                    auto
                />
                {params_ext.length !== 0 && <SanitizedDivider />}
                {params_ext.map(param => (
                    <GenericTransportParamInput
                        source={param}
                        label={labelize(param)}
                        key={param}
                    />
                ))}
            </CardFormIterator>
        </ArrayInput>
    );
};

const GenericSender = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <GenericSenderLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const GenericSenderLeg = ({ data }) => (
    <Card elevation={3}>
        <>
            <SimpleShowLayout record={data}>
                {Object.keys(data).map(param => (
                    <TransportParamField
                        source={param}
                        label={labelize(param)}
                        key={param}
                    />
                ))}
            </SimpleShowLayout>
        </>
    </Card>
);

const GenericSenderEdit = ({ record }) => {
    const data = get(record, '$staged.transport_params');
    const uniqueKeys = Object.keys(
        data.reduce((result, obj) => Object.assign(result, obj), {})
    );
    return (
        <ArrayInput
            label="Transport Parameters"
            source="$staged.transport_params"
        >
            <CardFormIterator disableRemove disableAdd>
                {uniqueKeys.map(param => (
                    <GenericTransportParamInput
                        key={param}
                        source={param}
                        label={labelize(param)}
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
            case 'urn:x-nmos:transport:mxl':
                return <MXLSender data={data} />;
            default:
                return <GenericSender data={data} />;
        }
    } else {
        switch (type) {
            case 'urn:x-nmos:transport:mqtt':
                return <MQTTSenderEdit record={record} />;
            case 'urn:x-nmos:transport:rtp':
                return <RTPSenderEdit record={record} />;
            case 'urn:x-nmos:transport:websocket':
                return <WebSocketSenderEdit record={record} />;
            case 'urn:x-nmos:transport:mxl':
                return <MXLSenderEdit record={record} />;
            default:
                return <GenericSenderEdit record={record} />;
        }
    }
};

export default SenderTransportParamsCardsGrid;
