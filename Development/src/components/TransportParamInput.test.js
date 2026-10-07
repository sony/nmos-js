import React from 'react';
import { Form } from 'react-final-form';
import { cleanup, fireEvent, render } from '@testing-library/react';
import TransportParamInput from './TransportParamInput';

afterEach(cleanup);

const renderEnum = (initial, choices, extra) => {
    const seen = {};
    render(
        <Form
            onSubmit={() => {}}
            initialValues={{ mode: initial }}
            render={({ values }) => {
                seen.values = values;
                return (
                    <TransportParamInput
                        source="mode"
                        label="FEC Mode"
                        kind="enum"
                        choices={choices}
                        {...extra}
                    />
                );
            }}
        />
    );
    return seen;
};

const openMenu = () => {
    fireEvent.mouseDown(document.querySelector('[role="button"]'));
    return Array.from(
        document.querySelector('[role="listbox"]').children,
        item =>
            item.tagName === 'HR'
                ? 'separator'
                : item.getAttribute('data-value')
    );
};

const clickChoice = dataValue => {
    fireEvent.click(document.querySelector(`li[data-value="${dataValue}"]`));
};

const choose = dataValue => {
    openMenu();
    clickChoice(dataValue);
};

describe('TransportParamInput enum', () => {
    it('stages a string choice', () => {
        const seen = renderEnum('1D', ['1D', '2D']);
        choose('2D');
        expect(seen.values.mode).toBe('2D');
    });

    it('moves an explicit auto after the separator', () => {
        const seen = renderEnum('1D', ['1D', 'auto', '2D']);
        expect(openMenu()).toEqual(['1D', '2D', 'separator', 'auto']);
        clickChoice('auto');
        expect(seen.values.mode).toBe('auto');
    });

    it('appends auto from the prop', () => {
        const seen = renderEnum('1D', ['1D', '2D'], { auto: true });
        expect(openMenu()).toEqual(['1D', '2D', 'separator', 'auto']);
        clickChoice('auto');
        expect(seen.values.mode).toBe('auto');
    });

    it('moves an explicit null after the separator', () => {
        const seen = renderEnum('1D', ['1D', null, '2D']);
        expect(openMenu()).toEqual(['1D', '2D', 'separator', '']);
        expect(document.querySelector('li[data-value=""]').textContent).toBe(
            'null'
        );
        clickChoice('');
        expect(seen.values.mode).toBe(null);
    });

    it('appends null from the nullable prop', () => {
        const seen = renderEnum('1D', ['1D', '2D'], { nullable: true });
        expect(openMenu()).toEqual(['1D', '2D', 'separator', '']);
        clickChoice('');
        expect(seen.values.mode).toBe(null);
        expect(document.querySelector('[role="button"]').textContent).toBe(
            'null'
        );
    });

    it('groups auto and null after one separator', () => {
        const seen = renderEnum('1D', ['auto', '1D', null, '2D']);
        expect(openMenu()).toEqual(['1D', '2D', 'separator', 'auto', '']);
        clickChoice('');
        expect(seen.values.mode).toBe(null);
    });
});
