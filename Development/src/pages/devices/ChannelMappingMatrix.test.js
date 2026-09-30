import {
    CELL_EXTENT,
    CHIP_EXTENT,
    CHIP_MARGIN,
} from '../../components/matrixLayout';
import { renderedSpanCentre } from '../../components/matrixViewport';
import {
    channelMappingConstraintWarnings,
    channelMappingCornerLabels,
    getMappingTableColumns,
    isRoutableInput,
    showMappingAssociations,
    sliceRenderedIO,
} from './ChannelMappingMatrix';

describe('matrix layout', () => {
    const inputs = [
        ['input0', { channels: [{}, {}] }],
        ['input1', { channels: [{}] }],
    ];
    const outputs = [
        ['output0', { channels: [{}, {}, {}] }],
        ['output1', { channels: [{}] }],
    ];
    const isExpanded = (resource, id) =>
        (resource === 'inputs' && id === 'input0') ||
        (resource === 'outputs' && id === 'output0');

    it('uses output leaves as columns in the default orientation', () => {
        expect(
            getMappingTableColumns(inputs, outputs, isExpanded, false)
        ).toEqual(['output0.0', 'output0.1', 'output0.2', 'output1']);
        expect(channelMappingCornerLabels(false)).toEqual({
            rows: 'INPUTS',
            columns: 'OUTPUTS',
        });
    });

    it('uses unrouted and input leaves as columns when axes are swapped', () => {
        expect(
            getMappingTableColumns(inputs, outputs, isExpanded, true)
        ).toEqual(['unrouted', 'input0.0', 'input0.1', 'input1']);
        expect(channelMappingCornerLabels(true)).toEqual({
            rows: 'OUTPUTS',
            columns: 'INPUTS',
        });
    });

    it('shows parent and source headings unless explicitly hidden', () => {
        expect(showMappingAssociations()).toBe(true);
        expect(
            showMappingAssociations({ 'parent/source headings': true })
        ).toBe(true);
        expect(
            showMappingAssociations({ 'parent/source headings': false })
        ).toBe(false);
    });

    it('slices expanded channels without repeating a clipped heading', () => {
        expect(sliceRenderedIO('inputs', inputs, isExpanded, 1, 3)).toEqual([
            ['input0', { channels: { 1: {} } }, 0],
            ['input1', { channels: [{}] }, CELL_EXTENT / 2],
        ]);
    });

    it('keeps a heading centred on its whole span', () => {
        const wide = [['wide', { channels: [{}, {}, {}, {}] }]];
        const expanded = () => true;

        expect(renderedSpanCentre(0, 4, 4)).toBe(2 * CELL_EXTENT);
        expect(sliceRenderedIO('inputs', wide, expanded, 1, 3)[0][2]).toBe(
            CELL_EXTENT
        );
        expect(sliceRenderedIO('inputs', wide, expanded, 3, 4)[0][2]).toBe(
            null
        );
    });

    it('pins a heading to the viewport edge when its centre is off screen', () => {
        const contentExtent = CHIP_EXTENT + 2 * CHIP_MARGIN;
        const onScreen = {
            gridOrigin: 0,
            offset: 0,
            scrollVar: '--matrix-scroll-left',
            sizeVar: '--matrix-view-width',
            viewStart: 0,
            viewEnd: 4 * CELL_EXTENT,
        };
        const half = contentExtent / 2;
        const centre = 2 * CELL_EXTENT;

        const leading = `max(0px, var(--matrix-scroll-left)) + ${half}px`;
        const trailing = `min(${4 * CELL_EXTENT}px, var(--matrix-scroll-left) + var(--matrix-view-width)) - ${half}px`;

        expect(renderedSpanCentre(0, 4, 4, onScreen)).toBe(
            `calc(clamp(min(${leading}, ${trailing}), ${centre}px, max(${leading}, ${trailing})) - 0px)`
        );
        expect(
            renderedSpanCentre(0, 4, 1, {
                ...onScreen,
                viewEnd: CELL_EXTENT,
            })
        ).toContain('var(--matrix-scroll-left)');
        expect(
            renderedSpanCentre(0, 4, 1, {
                ...onScreen,
                viewEnd: contentExtent - 1,
            })
        ).toBe(null);
    });

    it('keeps the original channel indexes when slicing', () => {
        expect(
            Object.keys(
                sliceRenderedIO('outputs', outputs, isExpanded, 1, 3)[0][1]
                    .channels
            )
        ).toEqual(['1', '2']);
    });
});

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
