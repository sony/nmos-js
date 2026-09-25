import { forwardRef } from 'react';
import { Tab, Tooltip } from '@material-ui/core';

// a disabled tab does not fire the mouse events a tooltip needs, so when
// there is a hint to show, anchor it on a wrapper around the tab
const HintedTab = forwardRef(({ hint, ...props }, ref) =>
    hint ? (
        <Tooltip arrow title={hint}>
            <span style={{ display: 'inline-flex' }}>
                <Tab {...props} ref={ref} />
            </span>
        </Tooltip>
    ) : (
        <Tab {...props} ref={ref} />
    )
);

export default HintedTab;
