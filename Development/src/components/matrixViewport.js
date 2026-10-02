import { useLayoutEffect, useRef, useState } from 'react';
import { CELL_EXTENT, CHIP_EXTENT, CHIP_MARGIN } from './matrixLayout';

export const MATRIX_OVERSCAN = 5;

// a chip plus the margin react-admin gives it; the centred control has to
// fit in the part of the span that is actually on screen
const SPAN_CONTENT_EXTENT = CHIP_EXTENT + 2 * CHIP_MARGIN;

// The mounted heading is only the on-screen part of a span. Centre its label
// on the whole span while that centre is in the viewport, and on the viewport
// edge once the centre has scrolled away but the label still fits.
export const renderedSpanCentre = (origin, extent, rendered, view) => {
    const localCentre = (extent / 2 - origin) * CELL_EXTENT;
    const renderedSize = rendered * CELL_EXTENT;
    if (!view) {
        if (localCentre < 0 || localCentre > renderedSize) return null;
        return localCentre;
    }

    const spanStart = (view.gridOrigin + view.offset) * CELL_EXTENT;
    const spanEnd = spanStart + extent * CELL_EXTENT;
    const mountedStart = spanStart + origin * CELL_EXTENT;
    const visibleStart = Math.max(spanStart, view.viewStart);
    const visibleEnd = Math.min(spanEnd, view.viewEnd);
    if (visibleEnd - visibleStart < SPAN_CONTENT_EXTENT) return null;

    const inset = SPAN_CONTENT_EXTENT / 2;
    const scroll = `var(${view.scrollVar})`;
    const viewport = `var(${view.sizeVar})`;
    const centre = spanStart + (extent * CELL_EXTENT) / 2;
    const leading = `max(${spanStart}px, ${scroll}) + ${inset}px`;
    const trailing = `min(${spanEnd}px, ${scroll} + ${viewport}) - ${inset}px`;
    // clamp() is max(MIN, min(VAL, MAX)), so an inverted range resolves to
    // MIN and parks the label on the far side of the cell. The median keeps
    // it on the span centre, and that centre passes under the corner.
    const nearer = `min(${leading}, ${trailing})`;
    const further = `max(${leading}, ${trailing})`;
    return `calc(clamp(${nearer}, ${centre}px, ${further}) - ${mountedStart}px)`;
};

const clamp = (value, minimum, maximum) =>
    Math.min(maximum, Math.max(minimum, value));

const rangeForAxis = ({
    count,
    headingExtent,
    overscan,
    scroll,
    viewportExtent,
}) => {
    const bodyViewportExtent = Math.max(0, viewportExtent - headingExtent);
    const firstVisible = clamp(Math.floor(scroll / CELL_EXTENT), 0, count);
    const lastVisible = clamp(
        Math.ceil((scroll + bodyViewportExtent) / CELL_EXTENT),
        firstVisible,
        count
    );
    const first = Math.max(0, firstVisible - overscan);
    const last = Math.min(count, lastVisible + overscan);

    return {
        first,
        firstVisible,
        last,
        lastVisible,
        leading: first * CELL_EXTENT,
        trailing: (count - last) * CELL_EXTENT,
    };
};

export const getMatrixViewport = ({
    clientHeight = 0,
    clientWidth = 0,
    columnCount,
    headingHeight,
    headingWidth,
    overscan = MATRIX_OVERSCAN,
    rowCount,
    scrollLeft = 0,
    scrollTop = 0,
    // a capped container never exceeds the window; bounding the measurement
    // stops an uncapped one, as tall as the whole table, mounting every row
    windowHeight = Infinity,
    windowWidth = Infinity,
}) => {
    const rows = rangeForAxis({
        count: rowCount,
        headingExtent: headingHeight,
        overscan,
        scroll: scrollTop,
        viewportExtent: Math.min(clientHeight, windowHeight),
    });
    const columns = rangeForAxis({
        count: columnCount,
        headingExtent: headingWidth,
        overscan,
        scroll: scrollLeft,
        viewportExtent: Math.min(clientWidth, windowWidth),
    });

    return {
        firstRow: rows.first,
        lastRow: rows.last,
        firstVisibleRow: rows.firstVisible,
        lastVisibleRow: rows.lastVisible,
        firstColumn: columns.first,
        lastColumn: columns.last,
        firstVisibleColumn: columns.firstVisible,
        lastVisibleColumn: columns.lastVisible,
        top: rows.leading,
        bottom: rows.trailing,
        left: columns.leading,
        right: columns.trailing,
    };
};

const sameViewport = (left, right) =>
    Object.keys(left).every(key => left[key] === right[key]);

export const useMatrixViewport = ({
    columnCount,
    containerRef,
    headingHeight,
    headingWidth,
    onScroll,
    overscan = MATRIX_OVERSCAN,
    rowCount,
}) => {
    const [viewport, setViewport] = useState(() =>
        getMatrixViewport({
            columnCount,
            headingHeight,
            headingWidth,
            overscan,
            rowCount,
        })
    );
    const frame = useRef(null);
    const onScrollRef = useRef(onScroll);
    onScrollRef.current = onScroll;

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        // the label reads these during scroll, between the cell boundaries
        // that change the mounted range, so they are not React state
        const writeScroll = () => {
            container.style.setProperty(
                '--matrix-scroll-left',
                `${container.scrollLeft}px`
            );
            container.style.setProperty(
                '--matrix-scroll-top',
                `${container.scrollTop}px`
            );
        };
        const update = () => {
            frame.current = null;
            const clientHeight = Math.min(
                container.clientHeight,
                window.innerHeight
            );
            const clientWidth = Math.min(
                container.clientWidth,
                window.innerWidth
            );
            writeScroll();
            container.style.setProperty(
                '--matrix-view-width',
                `${Math.max(0, clientWidth - headingWidth)}px`
            );
            container.style.setProperty(
                '--matrix-view-height',
                `${Math.max(0, clientHeight - headingHeight)}px`
            );
            const next = getMatrixViewport({
                clientHeight,
                clientWidth,
                columnCount,
                headingHeight,
                headingWidth,
                overscan,
                rowCount,
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop,
                windowHeight: window.innerHeight,
                windowWidth: window.innerWidth,
            });
            setViewport(current =>
                sameViewport(current, next) ? current : next
            );
        };
        const scheduleUpdate = () => {
            if (frame.current === null) {
                frame.current = window.requestAnimationFrame(update);
            }
        };
        const onContainerScroll = () => {
            writeScroll();
            if (onScrollRef.current) onScrollRef.current();
            scheduleUpdate();
        };

        update();
        container.addEventListener('scroll', onContainerScroll, {
            passive: true,
        });
        window.addEventListener('resize', scheduleUpdate);
        const resizeObserver =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(scheduleUpdate);
        if (resizeObserver) resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', onContainerScroll);
            window.removeEventListener('resize', scheduleUpdate);
            if (resizeObserver) resizeObserver.disconnect();
            if (frame.current !== null) {
                window.cancelAnimationFrame(frame.current);
                frame.current = null;
            }
        };
    }, [
        columnCount,
        containerRef,
        headingHeight,
        headingWidth,
        overscan,
        rowCount,
    ]);

    return viewport;
};
