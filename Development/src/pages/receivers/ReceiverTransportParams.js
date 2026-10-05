import React from 'react';
import { Card, Grid, Typography } from '@material-ui/core';
import { ArrayInput, SimpleShowLayout } from 'react-admin';
import { get, has } from 'lodash';
import CardFormIterator from '../../components/CardFormIterator';
import GenericTransportParamInput from '../../components/GenericTransportParamInput';
import TransportParamField from '../../components/TransportParamField';
import TransportParamInput from '../../components/TransportParamInput';
import { transportIsOneToOne } from '../../components/ParameterRegisters';
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
            <>
                <SimpleShowLayout record={data}>
                    {has(data, 'source_host') && (
                        <TransportParamField
                            source="source_host"
                            label="Source Host"
                        />
                    )}
                    {has(data, 'source_port') && (
                        <TransportParamField
                            source="source_port"
                            label="Source Port"
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
                    <TransportParamInput
                        source="source_host"
                        label="Source Host"
                        nullable
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
                {uniqueKeys.includes('broker_protocol') && (
                    <TransportParamInput
                        source="broker_protocol"
                        label="Broker Protocol"
                        kind="enum"
                        choices={['auto', 'mqtt', 'secure-mqtt']}
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
                    {has(data, 'multicast_ip') && (
                        <TransportParamField
                            source="multicast_ip"
                            label="Multicast IP"
                        />
                    )}
                    {has(data, 'interface_ip') && (
                        <TransportParamField
                            source="interface_ip"
                            label="Interface IP"
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
                    {has(data, 'fec_mode') && (
                        <TransportParamField
                            source="fec_mode"
                            label="FEC Mode"
                        />
                    )}
                    {has(data, 'fec_destination_ip') && (
                        <TransportParamField
                            source="fec_destination_ip"
                            label="FEC Destination IP"
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
                        nullable
                    />
                )}
                {uniqueKeys.includes('multicast_ip') && (
                    <TransportParamInput
                        source="multicast_ip"
                        label="Multicast IP"
                        nullable
                    />
                )}
                {uniqueKeys.includes('interface_ip') && (
                    <TransportParamInput
                        source="interface_ip"
                        label="Interface IP"
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
                {uniqueKeys.includes('fec_mode') && (
                    <TransportParamInput
                        source="fec_mode"
                        label="FEC Mode"
                        kind="enum"
                        choices={['auto', '1D', '2D']}
                    />
                )}
                {uniqueKeys.includes('fec_destination_ip') && (
                    <TransportParamInput
                        source="fec_destination_ip"
                        label="FEC Destination IP"
                        auto
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

const MXLReceiver = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <MXLReceiverLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const MXLReceiverLeg = ({ data }) => {
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

const MXLReceiverEdit = ({ record }) => {
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

const GenericReceiver = ({ data }) => (
    <Grid container spacing={2}>
        {Object.keys(data).map(i => (
            <Grid item sm key={i}>
                <GenericReceiverLeg data={data[i]} />
            </Grid>
        ))}
    </Grid>
);

const GenericReceiverLeg = ({ data }) => (
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

const GenericReceiverEdit = ({ record }) => {
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

const UnknownTransportType = () => (
    <Typography variant="body2">Unknown Type</Typography>
);

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
            case 'urn:x-nmos:transport:mxl':
                return <MXLReceiver data={data} />;
            default:
                return transportIsOneToOne(type) ? (
                    <GenericReceiver data={data} />
                ) : (
                    <UnknownTransportType />
                );
        }
    } else {
        switch (type) {
            case 'urn:x-nmos:transport:mqtt':
                return <MQTTReceiverEdit record={record} />;
            case 'urn:x-nmos:transport:rtp':
                return <RTPReceiverEdit record={record} />;
            case 'urn:x-nmos:transport:websocket':
                return <WebSocketReceiverEdit record={record} />;
            case 'urn:x-nmos:transport:mxl':
                return <MXLReceiverEdit record={record} />;
            default:
                return transportIsOneToOne(type) ? (
                    <GenericReceiverEdit record={record} />
                ) : (
                    <UnknownTransportType />
                );
        }
    }
};

export default ReceiverTransportParamsCardsGrid;
