import {
    channelMappingConstraintWarnings,
    isRoutableInput,
} from './ChannelMappingMatrix';

describe('isRoutableInput', () => {
    it('allows any input when routable_inputs is null', () => {
        const output = { caps: { routable_inputs: null } };

        expect(isRoutableInput(output, 'input0')).toBe(true);
        expect(isRoutableInput(output, null)).toBe(true);
    });

    it('allows inputs listed in routable_inputs', () => {
        const output = {
            caps: { routable_inputs: ['input0', 'input1'] },
        };

        expect(isRoutableInput(output, 'input1')).toBe(true);
    });

    it('warns for inputs not listed in routable_inputs', () => {
        const output = {
            caps: { routable_inputs: ['input0'] },
        };

        expect(isRoutableInput(output, 'input1')).toBe(false);
    });

    it('allows unroute only when routable_inputs includes null', () => {
        expect(
            isRoutableInput(
                { caps: { routable_inputs: ['input0', null] } },
                null
            )
        ).toBe(true);
        expect(
            isRoutableInput({ caps: { routable_inputs: ['input0'] } }, null)
        ).toBe(false);
    });

    it('leaves missing or malformed constraints to the Node', () => {
        expect(isRoutableInput({}, 'input0')).toBe(true);
        expect(
            isRoutableInput({ caps: { routable_inputs: 'input0' } }, 'input1')
        ).toBe(true);
    });
});

describe('channelMappingConstraintWarnings', () => {
    const io = {
        inputs: {
            reorderable: {
                caps: { block_size: 2, reordering: true },
            },
            fixed: {
                caps: { block_size: 2, reordering: false },
            },
        },
        outputs: {
            output0: {
                caps: { routable_inputs: null },
            },
        },
    };
    const outputMap = channels => ({ output0: channels });

    it('accepts a complete input block when reordering is allowed', () => {
        const warnings = channelMappingConstraintWarnings(
            io,
            outputMap({
                0: { input: 'reorderable', channel_index: 1 },
                1: { input: 'reorderable', channel_index: 0 },
            })
        );

        expect(warnings).toEqual({});
    });

    it('warns on selected channels in an incomplete input block', () => {
        const warnings = channelMappingConstraintWarnings(
            io,
            outputMap({
                0: { input: 'reorderable', channel_index: 0 },
            })
        );

        expect(warnings.output0[0]).toMatch(/complete blocks of 2/);
    });

    it('warns when selected channels come from different input blocks', () => {
        const warnings = channelMappingConstraintWarnings(
            io,
            outputMap({
                0: { input: 'reorderable', channel_index: 0 },
                1: { input: 'reorderable', channel_index: 2 },
            })
        );

        expect(warnings.output0[0]).toMatch(/complete blocks of 2/);
        expect(warnings.output0[1]).toMatch(/complete blocks of 2/);
    });

    it('warns when reordering changes the fixed channel offset', () => {
        const warnings = channelMappingConstraintWarnings(
            io,
            outputMap({
                0: { input: 'fixed', channel_index: 1 },
                1: { input: 'fixed', channel_index: 0 },
            })
        );

        expect(warnings.output0[0]).toMatch(/fixed offset/);
        expect(warnings.output0[1]).toMatch(/fixed offset/);
    });

    it('uses block size warnings ahead of reordering', () => {
        const warnings = channelMappingConstraintWarnings(
            io,
            outputMap({
                0: { input: 'fixed', channel_index: 0 },
                1: { input: 'fixed', channel_index: 2 },
            })
        );

        expect(warnings.output0[0]).toMatch(/complete blocks of 2/);
        expect(warnings.output0[1]).toMatch(/complete blocks of 2/);
    });

    it('uses routable inputs warnings ahead of other constraints', () => {
        const restrictedIo = {
            ...io,
            outputs: {
                output0: {
                    caps: { routable_inputs: ['reorderable'] },
                },
            },
        };
        const warnings = channelMappingConstraintWarnings(
            restrictedIo,
            outputMap({
                0: { input: 'fixed', channel_index: 1 },
                1: { input: 'fixed', channel_index: 0 },
            })
        );

        expect(warnings.output0[0]).toMatch(/routable inputs/);
        expect(warnings.output0[1]).toMatch(/routable inputs/);
    });
});
