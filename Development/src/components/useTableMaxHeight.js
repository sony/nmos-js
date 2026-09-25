import { useLayoutEffect, useRef, useState } from 'react';

// end the viewport at the bottom of the window, however tall the filter
// panels above it have grown, so the page itself does not also scroll
export const useTableMaxHeight = ref => {
    const [maxHeight, setMaxHeight] = useState();
    // the card and layout padding below the table, measured while the table
    // is uncapped so that capping it cannot change the measurement in turn
    const below = useRef();
    const updateMaxHeight = () => {
        if (!ref.current) return;
        const table = ref.current.getBoundingClientRect();
        if (below.current === undefined) {
            // until the page overflows, the table needs no cap, and the
            // padding below it cannot be told from the empty page below it
            if (document.documentElement.scrollHeight <= window.innerHeight) {
                return;
            }
            below.current =
                document.body.getBoundingClientRect().bottom - table.bottom;
        }
        const above = table.top + window.scrollY;
        setMaxHeight(Math.round(window.innerHeight - above - below.current));
    };
    // after every render, because anything above the table may have resized
    useLayoutEffect(() => {
        updateMaxHeight();
        window.addEventListener('resize', updateMaxHeight);
        return () => window.removeEventListener('resize', updateMaxHeight);
    });
    return maxHeight;
};

export default useTableMaxHeight;
