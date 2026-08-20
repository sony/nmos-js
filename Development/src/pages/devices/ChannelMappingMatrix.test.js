import { isRoutableInput } from './ChannelMappingMatrix';

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
