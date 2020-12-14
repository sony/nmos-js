import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import dataProvider from '../dataProvider';

// keys for parameters to be copied directly from sender to receiver
const oneToOneTransportParams = {
    'urn:x-nmos:transport:mqtt': [
        'broker_protocol',
        'broker_authorization',
        'broker_topic',
        'connection_status_broker_topic',
    ],
    'urn:x-nmos:transport:rtp': [
        'rtp_enabled',
        'source_ip',
        'destination_port',
        'fec_enabled',
        'fec_destination_ip',
        'fec_mode',
        'fec1D_destination_port',
        'fec2D_destination_port',
        'rtcp_enabled',
        'rtcp_destination_ip',
        'rtcp_destination_port',
    ],
    'urn:x-nmos:transport:websocket': [
        'connection_authorization',
        'connection_uri',
    ],
};

// create an array mapping receiver leg to sender leg
const createLegMap = (senderParams, patchParams, options) => {
    const legs = Math.min(senderParams.length, patchParams.length);
    if (legs === 1) {
        return [get(options, 'singleSenderLeg') || 0];
    }
    return [...Array(legs).keys()];
};

// get 'ext_' parameters supported by the receiver
const getExtParams = transportParams => {
    // each leg should have the same parameters but merge both anyway
    const uniqueKeys = Object.keys(
        transportParams.reduce((result, obj) => {
            return Object.assign(result, obj);
        }, {})
    );
    return uniqueKeys.filter(x => {
        return x.startsWith('ext_');
    });
};

// copy params from sender to receiver of the matching legs
const copyTransportParams = (senderParams, params, patchParams, legMap) => {
    legMap.forEach((senderLeg, receiverLeg) => {
        params.forEach(param => {
            const lhs = get(senderParams[senderLeg], param);
            if (lhs !== undefined) {
                set(patchParams[receiverLeg], param, lhs);
            }
        });
    });
};

// 'ipv4' or 'ipv6' multicast address?
export const isMulticast = address => {
    return (
        address.match(
            /^2(?:2[4-9]|3\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d?|0)){3}/
        ) || address.toLowerCase().startsWith('ff')
    );
};

const makePatchDataWithTransportParams = (data, options) => {
    let patchData = cloneDeep(data.receiver);

    const senderParams = get(data.sender, '$active.transport_params');
    if (!Array.isArray(senderParams)) return;

    let patchParams = get(patchData, '$staged.transport_params');
    if (!Array.isArray(patchParams)) return;

    // create a map of receiver leg to sender leg
    const legMap = createLegMap(senderParams, patchParams, options);

    // do the easy ones
    copyTransportParams(
        senderParams,
        oneToOneTransportParams[get(data.sender, '$transporttype')],
        patchParams,
        legMap
    );

    // do the 'ext_' ones
    copyTransportParams(
        senderParams,
        getExtParams(patchParams),
        patchParams,
        legMap
    );

    // do the transport-specific stuff
    switch (get(data.sender, '$transporttype')) {
        case 'urn:x-nmos:transport:mqtt':
            legMap.forEach((senderLeg, receiverLeg) => {
                const destination_host = get(
                    senderParams[senderLeg],
                    'destination_host'
                );
                set(patchParams[receiverLeg], 'source_host', destination_host);
                const destination_port = get(
                    senderParams[senderLeg],
                    'destination_port'
                );
                set(patchParams[receiverLeg], 'source_port', destination_port);
            });
            break;
        case 'urn:x-nmos:transport:rtp':
            legMap.forEach((senderLeg, receiverLeg) => {
                const destination_ip = get(
                    senderParams[senderLeg],
                    'destination_ip'
                );
                set(
                    patchParams[receiverLeg],
                    'multicast_ip',
                    isMulticast(destination_ip) ? destination_ip : null
                );
                set(
                    patchParams[receiverLeg],
                    'interface_ip',
                    isMulticast(destination_ip) ? 'auto' : destination_ip
                );
            });
            // additionally disable the second leg of an ST 2022-7 receiver
            // when connecting a single-legged sender
            for (let leg = legMap.length; leg < patchParams.length; ++leg) {
                set(patchParams[leg], 'rtp_enabled', false);
            }
            break;
        case 'urn:x-nmos:transport:websocket':
            break;
        default:
            break;
    }
    return patchData;
};

const makeConnection = (senderID, receiverID, endpoint, options) => {
    return new Promise((resolve, reject) => {
        if (endpoint !== 'active' && endpoint !== 'staged') {
            return reject('Invalid endpoint');
        }

        const getSenderDataPromise = new Promise(resolve =>
            dataProvider('GET_ONE', 'senders', {
                id: senderID,
            }).then(response =>
                resolve({ resource: 'sender', data: response.data })
            )
        );
        const getReceiverDataPromise = new Promise(resolve =>
            dataProvider('GET_ONE', 'receivers', {
                id: receiverID,
            }).then(response =>
                resolve({ resource: 'receiver', data: response.data })
            )
        );

        Promise.all([getSenderDataPromise, getReceiverDataPromise])
            .then(response => {
                let data = {};
                for (const i of response) {
                    data[i.resource] = i.data;
                }
                return data;
            })
            .then(data => {
                if (get(data, 'sender') === undefined) {
                    return reject(new Error("Couldn't get sender data"));
                }
                if (get(data, 'receiver') === undefined) {
                    return reject(new Error("Couldn't get receiver data"));
                }

                // don't test '$transporttype' here, as there's a sensible
                // default filter in the ConnectionManagementTab, but users
                // may choose to override that and rely on checking of
                // transport parameters at the receiver itself

                if (
                    endpoint === 'active' &&
                    !get(data, 'sender.$active.master_enable')
                ) {
                    return reject(new Error('Sender is not enabled'));
                }

                let patchData = makePatchDataWithTransportParams(data, options);
                if (get(data, 'sender.$transportfile')) {
                    set(
                        patchData,
                        '$staged.transport_file.data',
                        get(data.sender, '$transportfile')
                    );
                    // when preparing a PATCH which might include an SDP file,
                    // force the dataProvider to include `rtp_enabled`, because
                    // the spec doesn't define any means to indicate the active
                    // status of the Sender's legs in the SDP file
                    const legs = data.receiver.$staged.transport_params.length;
                    for (let i = 0; i < legs; i++) {
                        delete data.receiver.$staged.transport_params[i]
                            .rtp_enabled;
                    }
                }
                set(patchData, '$staged.master_enable', true);
                set(patchData, '$staged.sender_id', get(data.sender, 'id'));
                if (endpoint === 'active') {
                    set(
                        patchData,
                        '$staged.activation.mode',
                        'activate_immediate'
                    );
                }

                return {
                    id: get(data.receiver, 'id'),
                    data: patchData,
                    previousData: data.receiver,
                };
            })
            .then(params => dataProvider('UPDATE', 'receivers', params))
            .then(() => resolve())
            .catch(error => reject(error));
    });
};

export default makeConnection;
