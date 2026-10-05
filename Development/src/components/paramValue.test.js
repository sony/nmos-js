import { commitParamText, convertParam, shownParamText } from './paramValue';

describe('shownParamText', () => {
    it('shows a draft, and leaves auto and null blank', () => {
        expect(shownParamText('auto', true, '1')).toBe('1');
        expect(shownParamText('auto', true)).toBe('');
        expect(shownParamText('auto', false)).toBe('auto');
        expect(shownParamText(null, true)).toBe('');
        expect(shownParamText(undefined, false)).toBe('');
        expect(shownParamText('', true)).toBe('');
        expect(shownParamText(5, false)).toBe('5');
    });
});

describe('commitParamText', () => {
    it('keeps a blank string as an empty string', () => {
        expect(commitParamText('string', true, true, '', null)).toBe('');
        expect(commitParamText('string', false, false, '  ', 'kept')).toBe('');
    });

    it('clears a number to null only when null is allowed', () => {
        expect(commitParamText('integer', true, true, '', 5)).toBe(null);
        expect(commitParamText('number', false, true, '', 1.5)).toBe(1.5);
    });

    it('treats auto as the auto value only when the field allows it', () => {
        expect(commitParamText('integer', false, true, 'auto', 5)).toBe('auto');
        expect(commitParamText('integer', false, false, 'auto', 5)).toBe(5);
        expect(commitParamText('string', true, false, 'auto', null)).toBe(
            'auto'
        );
        expect(commitParamText('string', true, true, 'null', null)).toBe(
            'null'
        );
    });

    it('parses a JSON number and leaves other text unchanged', () => {
        expect(commitParamText('integer', false, true, '1.0', 1)).toBe(1);
        expect(commitParamText('integer', false, true, '1.0e4', 1)).toBe(10000);
        expect(commitParamText('integer', false, true, '3.141', 1)).toBe(1);
        expect(commitParamText('integer', false, true, '05', 1)).toBe(1);
        expect(commitParamText('integer', false, true, '0x2a', 1)).toBe(1);
        expect(commitParamText('number', false, false, '1.5', 1)).toBe(1.5);
        expect(commitParamText('number', false, false, 'true', 1)).toBe(1);
        expect(commitParamText('integer', true, true, 'null', 5)).toBe(5);
    });
});

describe('convertParam', () => {
    it('keeps auto, null, and an empty string', () => {
        expect(convertParam('auto', 'integer')).toBe('auto');
        expect(convertParam(null, 'boolean')).toBe(null);
        expect(convertParam('', 'number')).toBe('');
    });

    it('converts a concrete value when the new type can hold it', () => {
        expect(convertParam('1.0', 'integer')).toBe(1);
        expect(convertParam('05', 'integer')).toBe(null);
        expect(convertParam(5, 'string')).toBe('5');
        expect(convertParam('1.5', 'integer')).toBe(null);
        expect(convertParam(true, 'string')).toBe('true');
    });

    it('converts a boolean and rejects other text', () => {
        expect(convertParam(true, 'boolean')).toBe(true);
        expect(convertParam(false, 'boolean')).toBe(false);
        expect(convertParam('true', 'boolean')).toBe(true);
        expect(convertParam('false', 'boolean')).toBe(false);
        expect(convertParam('yes', 'boolean')).toBe(null);
    });
});
