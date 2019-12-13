import setJSON from 'json-ptr';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import dataProvider from '../dataProvider';

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

const getExtParams = transport_params => {
    const uniqueKeys = Object.keys(
        transport_params.reduce((result, obj) => {
            return Object.assign(result, obj);
        }, {})
    );
    return uniqueKeys.filter(x => {
        return x.startsWith('ext_');
    });
};

const copyTransportParams = (
    senderTransportParams,
    senderToReceiver,
    patchData
) => {
    senderTransportParams.forEach((leg, index) => {
        senderToReceiver.forEach(param => {
            const lhs = get(leg, param);
            if (lhs !== undefined) {
                setJSON.set(
                    patchData,
                    `/$staged/transport_params/${index}/${param}`,
                    lhs,
                    true
                );
            }
        });
    });
};

export const isMulticast = address => {
    return (
        address.match(
            /^2(?:2[4-9]|3\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d?|0)){3}/
        ) || address.toLowerCase().startsWith('ff')
    );
};

const makePatchDataWithTransportParams = data => {
    let patchData = cloneDeep(data.receiver);

    const senderTransportParams = get(data.sender, '$active.transport_params');
    if (!Array.isArray(senderTransportParams)) return;

    copyTransportParams(
        senderTransportParams,
        oneToOneTransportParams[get(data.sender, '$transporttype')],
        patchData
    );

    switch (get(data.sender, '$transporttype')) {
        case 'urn:x-nmos:transport:mqtt':
            copyTransportParams(
                senderTransportParams,
                getExtParams(get(data.sender, '$active.transport_params')),
                patchData
            );
            senderTransportParams.forEach((leg, index) => {
                const destination_host = get(leg, 'destination_host');
                setJSON.set(
                    patchData,
                    `/$staged/transport_params/${index}/source_host`,
                    destination_host,
                    true
                );
                const destination_port = get(leg, 'destination_port');
                setJSON.set(
                    patchData,
                    `/$staged/transport_params/${index}/source_port`,
                    destination_port,
                    true
                );
            });
            break;
        case 'urn:x-nmos:transport:rtp':
            senderTransportParams.forEach((leg, index) => {
                const destination_ip = get(leg, 'destination_ip');
                if (isMulticast(destination_ip)) {
                    setJSON.set(
                        patchData,
                        `/$staged/transport_params/${index}/multicast_ip`,
                        destination_ip,
                        true
                    );
                } else {
                    setJSON.set(
                        patchData,
                        `/$staged/transport_params/${index}/interface_ip`,
                        destination_ip,
                        true
                    );
                }
            });
            break;
        case 'urn:x-nmos:transport:websocket':
            copyTransportParams(
                senderTransportParams,
                getExtParams(get(data.sender, '$active.transport_params')),
                patchData
            );
            break;
        default:
    }
    return patchData;
};

const makeConnection = (senderID, receiverID, endpoint) => {
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
                if (get(data, 'sender') === undefined)
                    return reject(new Error("Couldn't get sender data"));
                if (get(data, 'receiver') === undefined)
                    return reject(new Error("Couldn't get receiver data"));
                if (
                    get(data.sender, '$transporttype') !==
                    get(data.receiver, '$transporttype')
                ) {
                    return reject(new Error('Transport types do not match'));
                }
                if (
                    endpoint === 'active' &&
                    !get(data, 'sender.$active.master_enable')
                ) {
                    return reject(new Error('Sender is not enabled'));
                }

                let patchData = makePatchDataWithTransportParams(data);
                if (get(data, 'sender.$transportfile')) {
                    setJSON.set(
                        patchData,
                        `/$staged/transport_file/data`,
                        get(data.sender, '$transportfile'),
                        true
                    );
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
