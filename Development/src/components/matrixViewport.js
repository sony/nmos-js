import { useLayoutEffect, useRef, useState } from 'react';
import { CELL_EXTENT } from './matrixLayout';

export const MATRIX_OVERSCAN = 5;

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
        last,
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
}) => {
    const rows = rangeForAxis({
        count: rowCount,
        headingExtent: headingHeight,
        overscan,
        scroll: scrollTop,
        viewportExtent: clientHeight,
    });
    const columns = rangeForAxis({
        count: columnCount,
        headingExtent: headingWidth,
        overscan,
        scroll: scrollLeft,
        viewportExtent: clientWidth,
    });

    return {
        firstRow: rows.first,
        lastRow: rows.last,
        firstColumn: columns.first,
        lastColumn: columns.last,
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

        const update = () => {
            frame.current = null;
            const next = getMatrixViewport({
                clientHeight: container.clientHeight,
                clientWidth: container.clientWidth,
                columnCount,
                headingHeight,
                headingWidth,
                overscan,
                rowCount,
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop,
            });
            setViewport(current =>
                sameViewport(current, next) ? current : next
            );
        };
        const scheduleUpdate = () => {
            if (onScrollRef.current) onScrollRef.current();
            if (frame.current === null) {
                frame.current = window.requestAnimationFrame(update);
            }
        };

        update();
        container.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);
        const resizeObserver =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(scheduleUpdate);
        if (resizeObserver) resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', scheduleUpdate);
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
