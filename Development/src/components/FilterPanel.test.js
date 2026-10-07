import React from 'react';
import { cleanup, render } from '@testing-library/react';
import FilterPanel, { AutocompleteFilter, StringFilter } from './FilterPanel';

afterEach(cleanup);

const TITLE = 'Basic query syntax does not support multiple values';

const panel = (usingRql, child) =>
    render(
        <FilterPanel
            filter={{ label: 'cam,mic' }}
            setFilter={() => {}}
            usingRql={usingRql}
        >
            {child}
        </FilterPanel>
    );

const titled = container => container.querySelector(`[title="${TITLE}"]`);

describe('comma in a text filter', () => {
    it('flags the input when basic query is in use', () => {
        const { container } = panel(false, <StringFilter source="label" />);
        expect(titled(container)).not.toBeNull();
        expect(container.querySelector('.Mui-error')).not.toBeNull();
    });

    it('leaves the input alone when RQL is in use', () => {
        const { container } = panel(true, <StringFilter source="label" />);
        expect(titled(container)).toBeNull();
        expect(container.querySelector('.Mui-error')).toBeNull();
    });

    it('leaves the input alone when the panel is not a query', () => {
        const { container } = panel(undefined, <StringFilter source="label" />);
        expect(titled(container)).toBeNull();
    });

    it('flags an autocomplete the same way', () => {
        const { container } = panel(
            false,
            <AutocompleteFilter source="label" freeSolo options={[]} />
        );
        expect(titled(container)).not.toBeNull();
    });

    it('flags a chip already on screen when RQL is turned off', () => {
        const props = usingRql => (
            <FilterPanel
                filter={{ label: 'cam,mic' }}
                setFilter={() => {}}
                usingRql={usingRql}
            >
                <StringFilter source="label" />
            </FilterPanel>
        );
        const { container, rerender } = render(props(true));
        expect(titled(container)).toBeNull();
        rerender(props(false));
        expect(titled(container)).not.toBeNull();
        expect(container.querySelector('.Mui-error')).not.toBeNull();
    });
});
