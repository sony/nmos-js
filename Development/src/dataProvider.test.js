import { fetchUtils } from 'react-admin';
import dataProvider, { channelMappingAction } from './dataProvider';

describe('channelMappingAction', () => {
    const activeMap = {
        output0: {
            0: { input: null, channel_index: null },
            1: { input: 'input0', channel_index: 1 },
        },
    };

    it('omits unchanged output channels', () => {
        expect(channelMappingAction(activeMap, activeMap)).toEqual({});
    });

    it('includes all changed output channels', () => {
        const requestedMap = {
            output0: {
                0: { input: 'input0', channel_index: 0 },
                1: { input: null, channel_index: null },
            },
            outputB: {
                0: { input: 'inputX', channel_index: 0 },
            },
        };

        expect(channelMappingAction(activeMap, requestedMap)).toEqual({
            output0: {
                0: { input: 'input0', channel_index: 0 },
                1: { input: null, channel_index: null },
            },
            outputB: {
                0: { input: 'inputX', channel_index: 0 },
            },
        });
    });

    it('uses null fields for an unrouted channel', () => {
        const requestedMap = {
            output0: {
                0: { input: null, channel_index: null },
                1: { input: null, channel_index: null },
            },
        };

        expect(channelMappingAction(activeMap, requestedMap)).toEqual({
            output0: {
                1: { input: null, channel_index: null },
            },
        });
    });

    it('compares with the map from the most recent activation', () => {
        const activatedMap = {
            output0: {
                0: { input: 'input0', channel_index: 0 },
                1: { input: 'input0', channel_index: 1 },
            },
        };
        const requestedMap = {
            output0: {
                0: { input: 'input0', channel_index: 0 },
                1: { input: null, channel_index: null },
            },
        };

        expect(channelMappingAction(activatedMap, requestedMap)).toEqual({
            output0: {
                1: { input: null, channel_index: null },
            },
        });
    });

    it('does not create an array for numeric channel indices', () => {
        const action = channelMappingAction(
            {},
            { outputX: { 0: { input: 'inputA', channel_index: 0 } } }
        );

        expect(Array.isArray(action.outputX)).toBe(false);
    });
});

describe('UPDATE devices', () => {
    const record = {
        id: '11111111-1111-4111-8111-111111111111',
        $channelmappingAPI: 'http://node/x-nmos/channelmapping/v1.0',
        $active: {
            map: {
                output0: {
                    0: { input: null, channel_index: null },
                },
            },
        },
    };

    it('posts an immediate activation of the changed channels', async () => {
        const fetchJson = jest
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue({ json: { activation0: {} } });

        const requestedMap = {
            output0: {
                0: { input: 'input0', channel_index: 0 },
            },
        };

        await dataProvider('UPDATE', 'devices', {
            id: record.id,
            data: { ...record, $active: { map: requestedMap } },
            previousData: record,
        });

        expect(fetchJson).toHaveBeenCalledWith(
            'http://node/x-nmos/channelmapping/v1.0/map/activations/',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    activation: { mode: 'activate_immediate' },
                    action: requestedMap,
                }),
            })
        );
    });

    it('posts a scheduled activation with requested_time', async () => {
        const fetchJson = jest
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue({ json: { activation0: {} } });

        const requestedMap = {
            output0: {
                0: { input: 'input0', channel_index: 0 },
            },
        };

        await dataProvider('UPDATE', 'devices', {
            id: record.id,
            data: {
                ...record,
                $active: { map: requestedMap },
                $activation: {
                    mode: 'activate_scheduled_relative',
                    requested_time: '0:1000000000',
                },
            },
            previousData: record,
        });

        expect(fetchJson).toHaveBeenCalledWith(
            'http://node/x-nmos/channelmapping/v1.0/map/activations/',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    activation: {
                        mode: 'activate_scheduled_relative',
                        requested_time: '0:1000000000',
                    },
                    action: requestedMap,
                }),
            })
        );
    });
});

describe('DELETE devices', () => {
    const record = {
        id: '11111111-1111-4111-8111-111111111111',
        $channelmappingAPI: 'http://node/x-nmos/channelmapping/v1.0',
    };

    it('deletes the pending activation, not the Device', async () => {
        const fetchJson = jest
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue({ json: {} });

        await dataProvider('DELETE', 'devices', {
            id: record.id,
            activationId: 'activation0',
            previousData: record,
        });

        expect(fetchJson).toHaveBeenCalledWith(
            'http://node/x-nmos/channelmapping/v1.0/map/activations/activation0',
            expect.objectContaining({
                method: 'DELETE',
            })
        );
    });
});

describe('UPDATE receivers', () => {
    const record = {
        id: '22222222-2222-4222-8222-222222222222',
        $connectionAPI:
            'http://node/x-nmos/connection/v1.2/single/receivers/22222222-2222-4222-8222-222222222222',
        $staged: {
            master_enable: true,
            transport_params: [{ channel_name: null }],
        },
    };
    const data = {
        ...record,
        $staged: {
            master_enable: true,
            transport_params: [{ channel_name: '11' }],
        },
    };

    const patchBody = async params => {
        const fetchJson = jest
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue({ json: { id: record.id } });
        await dataProvider('UPDATE', 'receivers', {
            id: record.id,
            data,
            previousData: record,
            ...params,
        });
        const [url, options] = fetchJson.mock.calls.pop();
        expect(url).toBe(`${record.$connectionAPI}/staged`);
        expect(options.method).toBe('PATCH');
        return JSON.parse(options.body);
    };

    it('takes a number entered as text to be a number', async () => {
        expect(await patchBody({})).toEqual({
            transport_params: [{ channel_name: 11 }],
        });
    });

    it('leaves a verbatim string as it is', async () => {
        expect(await patchBody({ verbatim: true })).toEqual({
            transport_params: [{ channel_name: '11' }],
        });
    });
});
