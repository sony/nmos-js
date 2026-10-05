import dataProvider from '../dataProvider';
import makeConnection from './makeConnection';
import { TRANSPORTS, transportIsOneToOne } from './ParameterRegisters';

const TRANSPORT_EXAMPLE = 'urn:x-example:transport:carrier-pigeon';

jest.mock('../dataProvider', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const connect = async (sender, receiver) => {
    dataProvider.mockResolvedValue({ data: {} });
    await makeConnection(sender.id, receiver.id, 'active', {
        sender,
        receiver,
    });
    expect(dataProvider).toHaveBeenCalledTimes(1);
    const [type, resource, params] = dataProvider.mock.calls[0];
    expect(type).toBe('UPDATE');
    expect(resource).toBe('receivers');
    return params;
};

const ends = transport => ({
    sender: {
        id: 'sender0',
        $connectionAPI:
            'http://node/x-nmos/connection/v1.2/single/senders/sender0',
        $transporttype: transport,
        $active: {
            master_enable: true,
            transport_params: [{ channel_name: '11' }],
        },
    },
    receiver: {
        id: 'receiver0',
        $connectionAPI:
            'http://node/x-nmos/connection/v1.2/single/receivers/receiver0',
        $staged: {
            master_enable: false,
            sender_id: null,
            activation: { mode: null, requested_time: null },
            transport_params: [{ channel_name: null }],
        },
    },
});

describe('makeConnection', () => {
    afterEach(() => {
        jest.clearAllMocks();
        delete TRANSPORTS[TRANSPORT_EXAMPLE];
    });

    const expectRefused = async transport => {
        const { sender, receiver } = ends(transport);
        await expect(
            makeConnection(sender.id, receiver.id, 'active', {
                sender,
                receiver,
            })
        ).rejects.toThrow(`Cannot connect transport ${transport}`);
        expect(dataProvider).not.toHaveBeenCalled();
    };

    it('refuses a transport that has not opted in', async () => {
        await expectRefused(TRANSPORT_EXAMPLE);
    });

    it('refuses DASH, which is named but has not opted in', async () => {
        await expectRefused('urn:x-nmos:transport:dash');
    });

    it('copies parameters present on both ends when the transport opts in', async () => {
        TRANSPORTS[TRANSPORT_EXAMPLE] = {
            label: 'Carrier Pigeon',
            oneToOne: true,
        };
        const sender = {
            id: 'sender0',
            $connectionAPI:
                'http://node/x-nmos/connection/v1.2/single/senders/sender0',
            $transporttype: TRANSPORT_EXAMPLE,
            $active: {
                master_enable: true,
                transport_params: [
                    {
                        channel_name: '11',
                        device_name: 'Device-A',
                        ext_note: 'keep',
                        sender_only: 1,
                    },
                ],
            },
        };
        const receiver = {
            id: 'receiver0',
            $connectionAPI:
                'http://node/x-nmos/connection/v1.2/single/receivers/receiver0',
            $staged: {
                master_enable: false,
                sender_id: null,
                activation: { mode: null, requested_time: null },
                transport_params: [
                    {
                        channel_name: null,
                        device_name: null,
                        ext_note: null,
                        receiver_only: 2,
                    },
                ],
            },
        };

        expect(transportIsOneToOne(`${TRANSPORT_EXAMPLE}.bar`)).toBe(true);
        expect(transportIsOneToOne(`${TRANSPORT_EXAMPLE}/v1.0`)).toBe(true);

        const params = await connect(sender, receiver);

        expect(params.data.$staged.transport_params).toEqual([
            {
                channel_name: '11',
                device_name: 'Device-A',
                ext_note: 'keep',
                receiver_only: 2,
            },
        ]);
        expect(params.data.$staged.sender_id).toBe('sender0');
        expect(params.data.$staged.master_enable).toBe(true);
        expect(params.data.$staged.activation.mode).toBe('activate_immediate');
    });

    it('still copies only the listed parameters for RTP', async () => {
        const sender = {
            id: 'sender0',
            $connectionAPI:
                'http://node/x-nmos/connection/v1.1/single/senders/sender0',
            $transporttype: 'urn:x-nmos:transport:rtp',
            $active: {
                master_enable: true,
                transport_params: [
                    {
                        source_ip: '192.0.2.1',
                        destination_ip: '233.252.0.1',
                        destination_port: 5004,
                        source_port: 5004,
                        rtp_enabled: true,
                    },
                ],
            },
        };
        const receiver = {
            id: 'receiver0',
            $connectionAPI:
                'http://node/x-nmos/connection/v1.1/single/receivers/receiver0',
            $staged: {
                master_enable: false,
                sender_id: null,
                activation: { mode: null, requested_time: null },
                transport_params: [
                    {
                        source_ip: null,
                        multicast_ip: null,
                        interface_ip: 'auto',
                        destination_port: 'auto',
                        source_port: 'auto',
                        rtp_enabled: true,
                    },
                ],
            },
        };

        const params = await connect(sender, receiver);

        expect(params.data.$staged.transport_params).toEqual([
            {
                source_ip: '192.0.2.1',
                multicast_ip: '233.252.0.1',
                interface_ip: 'auto',
                destination_port: 5004,
                source_port: 'auto',
                rtp_enabled: true,
            },
        ]);
    });
});
