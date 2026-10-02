import { CELL_EXTENT } from './matrixLayout';
import { getMatrixViewport } from './matrixViewport';

const viewport = overrides =>
    getMatrixViewport({
        clientHeight: 720,
        clientWidth: 920,
        columnCount: 100,
        headingHeight: 240,
        headingWidth: 120,
        rowCount: 100,
        ...overrides,
    });

it('renders the visible body and five cells of overscan', () => {
    expect(viewport()).toEqual({
        firstRow: 0,
        lastRow: 16,
        firstVisibleRow: 0,
        lastVisibleRow: 11,
        firstColumn: 0,
        lastColumn: 23,
        firstVisibleColumn: 0,
        lastVisibleColumn: 18,
        top: 0,
        bottom: 84 * CELL_EXTENT,
        left: 0,
        right: 77 * CELL_EXTENT,
    });
});

it('moves only after crossing a cell boundary and keeps overscan', () => {
    expect(viewport({ scrollLeft: 79, scrollTop: 39 })).toMatchObject({
        firstRow: 0,
        lastRow: 17,
        firstColumn: 0,
        lastColumn: 25,
    });
    expect(viewport({ scrollLeft: 240, scrollTop: 280 })).toMatchObject({
        firstRow: 1,
        lastRow: 22,
        firstColumn: 0,
        lastColumn: 29,
    });
});

it('clips the range and spacers at the final row and column', () => {
    expect(
        viewport({
            columnCount: 10,
            rowCount: 8,
            scrollLeft: 1000,
            scrollTop: 1000,
        })
    ).toEqual({
        firstRow: 3,
        lastRow: 8,
        firstVisibleRow: 8,
        lastVisibleRow: 8,
        firstColumn: 5,
        lastColumn: 10,
        firstVisibleColumn: 10,
        lastVisibleColumn: 10,
        top: 3 * CELL_EXTENT,
        bottom: 0,
        left: 5 * CELL_EXTENT,
        right: 0,
    });
});

it('returns an empty range for an empty matrix', () => {
    expect(viewport({ columnCount: 0, rowCount: 0 })).toEqual({
        firstRow: 0,
        lastRow: 0,
        firstVisibleRow: 0,
        lastVisibleRow: 0,
        firstColumn: 0,
        lastColumn: 0,
        firstVisibleColumn: 0,
        lastVisibleColumn: 0,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    });
});

it('measures an uncapped container as no larger than the window', () => {
    expect(
        viewport({
            clientHeight: 100 * CELL_EXTENT,
            clientWidth: 100 * CELL_EXTENT,
            windowHeight: 720,
            windowWidth: 920,
        })
    ).toEqual(viewport());
});

it('uses overscan alone before the container has been measured', () => {
    expect(
        viewport({
            clientHeight: 0,
            clientWidth: 0,
            headingHeight: 0,
            headingWidth: 0,
        })
    ).toMatchObject({
        firstRow: 0,
        lastRow: 5,
        firstColumn: 0,
        lastColumn: 5,
    });
});
