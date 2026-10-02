import { useEffect } from 'react';

export const MATRIX_CROSSHAIR_CLASS = 'matrix-crosshair';
export const MATRIX_CROSSHAIR_BAND_CLASS = 'matrix-crosshair-band';

const isSpacer = cell =>
    cell.hasAttribute('aria-hidden') ||
    (cell.parentElement && cell.parentElement.hasAttribute('aria-hidden'));

// Headings use rowspan and colspan, so a cell's index in its row is not its
// column. Walk the table, and remember which columns a rowspan still occupies
// on the rows below.
const placeCells = table => {
    const occupied = [];
    const placed = [];
    const rows = table.rows;
    for (let row = 0; row < rows.length; row += 1) {
        let col = 0;
        const taken = occupied[row];
        for (const cell of rows[row].cells) {
            while (taken && taken[col]) col += 1;
            const rowSpan = cell.rowSpan || 1;
            const colSpan = cell.colSpan || 1;
            placed.push({ cell, row, col, rowSpan, colSpan });
            for (let below = 1; below < rowSpan; below += 1) {
                const slots = occupied[row + below] || [];
                occupied[row + below] = slots;
                for (let across = 0; across < colSpan; across += 1) {
                    slots[col + across] = true;
                }
            }
            col += colSpan;
        }
    }
    return placed;
};

const overlaps = (start, span, otherStart, otherSpan) =>
    start < otherStart + otherSpan && otherStart < start + span;

const contains = (start, span, otherStart, otherSpan) =>
    start <= otherStart && otherStart + otherSpan <= start + span;

// column headings sit above the body, row headings to its left
const headingAxis = (entry, bodyRow, bodyCol) => {
    if (entry.row + entry.rowSpan <= bodyRow && entry.col >= bodyCol) {
        return 'column';
    }
    if (entry.col + entry.colSpan <= bodyCol && entry.row >= bodyRow) {
        return 'row';
    }
    return null;
};

const axisRange = (entry, axis) =>
    axis === 'column' ? [entry.col, entry.colSpan] : [entry.row, entry.rowSpan];

// A heading lights the body cells it covers, with its parent and nested
// headings. A body cell lights its whole row and column, including the
// headings that cover that cell. The body wash is drawn as one band per
// axis; the class is only for the headings, which are not rectangular.
const resolveCrosshair = (table, cell) => {
    const placed = placeCells(table);
    const origin = placed.find(entry => entry.cell === cell);
    const empty = { bands: 'none', bodyFirst: null, bodyLast: null, cells: [] };
    if (!origin || isSpacer(cell)) return empty;

    const body = placed.filter(
        entry => entry.cell.tagName === 'TD' && !isSpacer(entry.cell)
    );
    const bodyFirst = body.length ? body[0].cell : null;
    const bodyLast = body.length ? body[body.length - 1].cell : null;
    const paint = (cells, bands) => ({ bands, bodyFirst, bodyLast, cells });

    if (cell.tagName !== 'TH') {
        return paint(
            placed
                .filter(
                    entry =>
                        !isSpacer(entry.cell) &&
                        (overlaps(
                            origin.row,
                            origin.rowSpan,
                            entry.row,
                            entry.rowSpan
                        ) ||
                            overlaps(
                                origin.col,
                                origin.colSpan,
                                entry.col,
                                entry.colSpan
                            ))
                )
                .map(entry => entry.cell),
            'both'
        );
    }

    if (body.length === 0) return empty;
    const bodyRow = Math.min(...body.map(entry => entry.row));
    const bodyCol = Math.min(...body.map(entry => entry.col));
    const axis = headingAxis(origin, bodyRow, bodyCol);
    if (!axis) return empty;
    const [originStart, originSpan] = axisRange(origin, axis);

    return paint(
        placed
            .filter(entry => {
                if (isSpacer(entry.cell)) return false;
                const [start, span] = axisRange(entry, axis);
                if (entry.cell.tagName === 'TD') {
                    return overlaps(originStart, originSpan, start, span);
                }
                // headings beside this one stay plain; a parent and the
                // headings nested under it light together
                return (
                    entry.cell.tagName === 'TH' &&
                    headingAxis(entry, bodyRow, bodyCol) === axis &&
                    (contains(start, span, originStart, originSpan) ||
                        contains(originStart, originSpan, start, span))
                );
            })
            .map(entry => entry.cell),
        axis
    );
};

export const crosshairTargets = (table, cell) =>
    resolveCrosshair(table, cell).cells;

// the heading and cell tips are portaled onto the document, so the pointer
// can leave the table while it is still on the tip that this hover opened
const inTooltip = node =>
    node instanceof Element &&
    Boolean(node.closest('.MuiTooltip-popper, [role="tooltip"]'));

const stillHovering = (container, node) =>
    node instanceof Element && (container.contains(node) || inTooltip(node));

const bandElement = container => {
    const band = document.createElement('div');
    band.className = MATRIX_CROSSHAIR_BAND_CLASS;
    band.hidden = true;
    container.appendChild(band);
    return band;
};

const contentBox = (container, el) => {
    const rect = el.getBoundingClientRect();
    const base = container.getBoundingClientRect();
    return {
        top: rect.top - base.top - container.clientTop + container.scrollTop,
        left:
            rect.left - base.left - container.clientLeft + container.scrollLeft,
        width: rect.width,
        height: rect.height,
    };
};

const placeBand = (band, box) => {
    if (!box) {
        band.hidden = true;
        return;
    }
    band.hidden = false;
    band.style.width = `${box.width}px`;
    band.style.height = `${box.height}px`;
    band.style.transform = `translate(${box.left}px, ${box.top}px)`;
};

export const bindMatrixCrosshair = container => {
    let current = null;
    let highlighted = [];
    let clearTimer = null;
    const columnBand = bandElement(container);
    const rowBand = bandElement(container);
    const clear = () => {
        if (clearTimer !== null) {
            window.clearTimeout(clearTimer);
            clearTimer = null;
        }
        highlighted.forEach(cell =>
            cell.classList.remove(MATRIX_CROSSHAIR_CLASS)
        );
        highlighted = [];
        columnBand.hidden = true;
        rowBand.hidden = true;
        current = null;
    };
    const spanBox = (startCell, endCell) => {
        const start = contentBox(container, startCell);
        const end = contentBox(container, endCell);
        const top = Math.min(start.top, end.top);
        const left = Math.min(start.left, end.left);
        return {
            top,
            left,
            width:
                Math.max(start.left + start.width, end.left + end.width) - left,
            height:
                Math.max(start.top + start.height, end.top + end.height) - top,
        };
    };
    // a heading's body cells are one rectangle, measured from those cells so
    // a stuck heading does not place the wash at its scrolled position
    const layBands = (bands, cell, bodyFirst, bodyLast, cells) => {
        const covered = cells.filter(target => target.tagName === 'TD');
        if (bands === 'none' || covered.length === 0 || !bodyFirst) {
            columnBand.hidden = true;
            rowBand.hidden = true;
            return;
        }
        if (bands !== 'both') {
            placeBand(
                columnBand,
                spanBox(covered[0], covered[covered.length - 1])
            );
            rowBand.hidden = true;
            return;
        }
        const origin = contentBox(container, cell);
        const body = spanBox(bodyFirst, bodyLast);
        placeBand(columnBand, {
            top: body.top,
            left: origin.left,
            width: origin.width,
            height: body.height,
        });
        placeBand(rowBand, {
            top: origin.top,
            left: body.left,
            width: body.width,
            height: origin.height,
        });
    };
    // a short gap between the cell and its tip must not drop the wash
    const scheduleClear = () => {
        if (clearTimer !== null) return;
        clearTimer = window.setTimeout(() => {
            clearTimer = null;
            clear();
        }, 100);
    };
    const paint = cell => {
        const table = cell.closest('table');
        if (!table) return;
        const resolved = resolveCrosshair(table, cell);
        const heads = resolved.cells.filter(target => target.tagName === 'TH');
        const staying = new Set(heads);
        const lit = new Set(highlighted);
        highlighted.forEach(head => {
            if (!staying.has(head))
                head.classList.remove(MATRIX_CROSSHAIR_CLASS);
        });
        heads.forEach(head => {
            if (!lit.has(head)) head.classList.add(MATRIX_CROSSHAIR_CLASS);
        });
        highlighted = heads;
        current = cell;
        layBands(
            resolved.bands,
            cell,
            resolved.bodyFirst,
            resolved.bodyLast,
            resolved.cells
        );
    };
    const onOver = event => {
        const cell = event.target.closest('td, th');
        if (!cell || !container.contains(cell) || isSpacer(cell)) {
            if (current) clear();
            return;
        }
        if (clearTimer !== null) {
            window.clearTimeout(clearTimer);
            clearTimer = null;
        }
        if (cell === current) return;
        paint(cell);
    };
    const onLeave = event => {
        if (event.relatedTarget == null) clear();
    };
    const onDocumentOver = event => {
        if (!current) return;
        if (stillHovering(container, event.target)) {
            if (clearTimer !== null) {
                window.clearTimeout(clearTimer);
                clearTimer = null;
            }
            return;
        }
        scheduleClear();
    };
    // a wheel scroll mounts cells without moving the pointer, so the wash is
    // applied again once those cells exist
    let frame = null;
    const refresh = () => {
        frame = null;
        if (current && current.isConnected) paint(current);
    };
    const scheduleRefresh = () => {
        if (frame !== null) return;
        frame = window.requestAnimationFrame(refresh);
    };
    const observer = new MutationObserver(scheduleRefresh);
    const table = container.querySelector('table');
    if (table) observer.observe(table, { childList: true, subtree: true });
    container.addEventListener('mouseover', onOver);
    container.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseover', onDocumentOver);
    return () => {
        container.removeEventListener('mouseover', onOver);
        container.removeEventListener('mouseleave', onLeave);
        document.removeEventListener('mouseover', onDocumentOver);
        observer.disconnect();
        if (frame !== null) window.cancelAnimationFrame(frame);
        clear();
        columnBand.remove();
        rowBand.remove();
    };
};

export const useMatrixCrosshair = containerRef => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;
        return bindMatrixCrosshair(container);
    }, [containerRef]);
};
