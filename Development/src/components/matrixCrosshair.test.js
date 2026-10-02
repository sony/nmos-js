import {
    MATRIX_CROSSHAIR_BAND_CLASS,
    MATRIX_CROSSHAIR_CLASS,
    bindMatrixCrosshair,
    crosshairTargets,
} from './matrixCrosshair';

const table = () => {
    document.body.innerHTML = `
        <table>
            <tr>
                <th id="corner" rowspan="2"></th>
                <th id="parent" colspan="2"></th>
            </tr>
            <tr>
                <th id="leaf0"></th>
                <th id="leaf1"></th>
            </tr>
            <tr>
                <th id="rows" rowspan="2"></th>
                <td id="a0"></td>
                <td id="a1"></td>
            </tr>
            <tr>
                <td id="b0"></td>
                <td id="b1"></td>
            </tr>
            <tr aria-hidden="true">
                <td id="spacer" colspan="3"></td>
            </tr>
        </table>
    `;
    return document.querySelector('table');
};

const ids = cells => cells.map(cell => cell.id).sort();

it('lights the row, the column, and the headings that span them', () => {
    const grid = table();
    expect(ids(crosshairTargets(grid, grid.querySelector('#a0')))).toEqual(
        ['a0', 'a1', 'b0', 'leaf0', 'parent', 'rows'].sort()
    );
});

it('finds a column that a rowspan heading occupies on a later row', () => {
    const grid = table();
    expect(ids(crosshairTargets(grid, grid.querySelector('#b1')))).toEqual(
        ['a1', 'b0', 'b1', 'leaf1', 'parent', 'rows'].sort()
    );
});

it('does not light a spacer row', () => {
    const grid = table();
    expect(crosshairTargets(grid, grid.querySelector('#spacer'))).toEqual([]);
});

it('lights the body columns and channel headings an expanded heading covers', () => {
    const grid = table();
    expect(ids(crosshairTargets(grid, grid.querySelector('#parent')))).toEqual(
        ['a0', 'a1', 'b0', 'b1', 'leaf0', 'leaf1', 'parent'].sort()
    );
});

it('lights one body column from its leaf heading', () => {
    const grid = table();
    expect(ids(crosshairTargets(grid, grid.querySelector('#leaf0')))).toEqual(
        ['a0', 'b0', 'leaf0', 'parent'].sort()
    );
});

it('lights a device heading with its senders, but not the other axis', () => {
    document.body.innerHTML = `
        <table>
            <tr>
                <th id="corner" rowspan="2" colspan="2"></th>
                <th id="deviceCol" colspan="2"></th>
            </tr>
            <tr>
                <th id="sender0"></th>
                <th id="sender1"></th>
            </tr>
            <tr>
                <th id="deviceRow" rowspan="2"></th>
                <th id="recv0"></th>
                <td id="a0"></td>
                <td id="a1"></td>
            </tr>
            <tr>
                <th id="recv1"></th>
                <td id="b0"></td>
                <td id="b1"></td>
            </tr>
        </table>
    `;
    const grid = document.querySelector('table');
    expect(ids(crosshairTargets(grid, grid.querySelector('#sender0')))).toEqual(
        ['a0', 'b0', 'deviceCol', 'sender0'].sort()
    );
    expect(
        ids(crosshairTargets(grid, grid.querySelector('#deviceCol')))
    ).toEqual(
        ['a0', 'a1', 'b0', 'b1', 'deviceCol', 'sender0', 'sender1'].sort()
    );
    expect(ids(crosshairTargets(grid, grid.querySelector('#recv0')))).toEqual(
        ['a0', 'a1', 'deviceRow', 'recv0'].sort()
    );
    expect(
        ids(crosshairTargets(grid, grid.querySelector('#deviceRow')))
    ).toEqual(['a0', 'a1', 'b0', 'b1', 'deviceRow', 'recv0', 'recv1'].sort());
});

it('lights the body rows an expanded row heading covers', () => {
    const grid = table();
    expect(ids(crosshairTargets(grid, grid.querySelector('#rows')))).toEqual(
        ['a0', 'a1', 'b0', 'b1', 'rows'].sort()
    );
});

it('does not light anything from the corner', () => {
    const grid = table();
    expect(crosshairTargets(grid, grid.querySelector('#corner'))).toEqual([]);
});

it('lights a heading mounted while the pointer stays on the cell', async () => {
    document.body.innerHTML = `
        <div id="matrix">
            <table>
                <tr><th id="corner"></th><th id="col"></th></tr>
                <tr><th id="row"></th><td id="a"></td></tr>
            </table>
        </div>
    `;
    const matrix = document.getElementById('matrix');
    const unbind = bindMatrixCrosshair(matrix);
    const frames = [];
    const spy = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(callback => {
            frames.push(callback);
            return frames.length;
        });
    document
        .getElementById('a')
        .dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    const fresh = document.createElement('th');
    fresh.id = 'col-next';
    matrix
        .querySelector('tr')
        .replaceChild(fresh, document.getElementById('col'));
    await Promise.resolve();
    expect(frames).toHaveLength(1);
    frames[0]();
    expect(fresh.classList.contains(MATRIX_CROSSHAIR_CLASS)).toBe(true);
    spy.mockRestore();
    unbind();
});

it('keeps the crosshair while the pointer is on the tip', () => {
    jest.useFakeTimers();
    document.body.innerHTML = `
        <div id="matrix"><table><tr><td id="a"></td></tr></table></div>
        <div id="tip" role="tooltip"></div>
        <div id="outside"></div>
    `;
    const matrix = document.getElementById('matrix');
    const cell = document.getElementById('a');
    const tip = document.getElementById('tip');
    const unbind = bindMatrixCrosshair(matrix);
    const shown = () =>
        [...matrix.querySelectorAll(`.${MATRIX_CROSSHAIR_BAND_CLASS}`)].some(
            band => !band.hidden
        );
    cell.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    matrix.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: tip }));
    tip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    jest.advanceTimersByTime(100);
    expect(shown()).toBe(true);

    document
        .getElementById('outside')
        .dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(shown()).toBe(true);
    jest.advanceTimersByTime(100);
    expect(shown()).toBe(false);
    unbind();
    jest.useRealTimers();
});
