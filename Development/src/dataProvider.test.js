import { fetchUtils } from 'react-admin';
import dataProvider, {
    channelMappingAction,
    transportFileMediaType,
} from './dataProvider';

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
    };

    const patchBody = async (previous, next, params) => {
        const staged = value => ({
            master_enable: true,
            transport_params: [{ channel_name: value }],
        });
        const fetchJson = jest
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue({ json: { id: record.id } });
        await dataProvider('UPDATE', 'receivers', {
            id: record.id,
            previousData: { ...record, $staged: staged(previous) },
            data: { ...record, $staged: staged(next) },
            ...params,
        });
        const [url, options] = fetchJson.mock.calls.pop();
        expect(url).toBe(`${record.$connectionAPI}/staged`);
        expect(options.method).toBe('PATCH');
        return JSON.parse(options.body);
    };

    const edited = value => ({
        transport_params: [{ channel_name: value }],
    });
    const omitted = { transport_params: [{}] };

    it.each([
        ['null to a digit string', null, '11', edited('11')],
        ['null to the word true', null, 'true', edited('true')],
        ['null to an empty string', null, '', edited('')],
        ['a string kept as a string', '11', '12', edited('12')],
        ['a string cleared', 'meow', '', edited('')],
        ['a number replaced by a string', 42, '57', edited('57')],
        ['an unchanged value', 42, 42, omitted],
    ])('%s', async (name, previous, next, expected) => {
        expect(await patchBody(previous, next)).toEqual(expected);
    });

    it('patches a boolean switch as a boolean', async () => {
        expect(await patchBody(false, true)).toEqual(edited(true));
    });

    const filePatch = async (previous, next) => {
        const fetchJson = jest
            .spyOn(fetchUtils, 'fetchJson')
            .mockResolvedValue({ json: { id: record.id } });
        const staged = transport_file => ({
            master_enable: true,
            transport_params: [{}],
            transport_file,
        });
        await dataProvider('UPDATE', 'receivers', {
            id: record.id,
            previousData: { ...record, $staged: staged(previous) },
            data: { ...record, $staged: staged(next) },
        });
        return JSON.parse(fetchJson.mock.calls.pop()[1].body);
    };

    it('clears the transport file type when the data is cleared', async () => {
        expect(
            await filePatch(
                { data: 'v=0', type: 'application/sdp' },
                { data: null, type: 'application/sdp' }
            )
        ).toEqual({
            transport_params: [{}],
            transport_file: { data: null, type: null },
        });
    });

    it('keeps a transport file type set with the data', async () => {
        expect(
            await filePatch(
                { data: null, type: null },
                { data: 'v=0', type: 'text/plain' }
            )
        ).toEqual({
            transport_params: [{}],
            transport_file: { data: 'v=0', type: 'text/plain' },
        });
    });

    it('sends the transport file type with changed data when the type is unchanged', async () => {
        expect(
            await filePatch(
                { data: 'v=0', type: 'application/sdp' },
                { data: 'v=1', type: 'application/sdp' }
            )
        ).toEqual({
            transport_params: [{}],
            transport_file: { data: 'v=1', type: 'application/sdp' },
        });
    });
});

describe('transportFileMediaType', () => {
    it('drops parameters and ignores a missing header', () => {
        expect(transportFileMediaType('application/sdp; charset=utf-8')).toBe(
            'application/sdp'
        );
        expect(transportFileMediaType(null)).toBeUndefined();
    });
});
