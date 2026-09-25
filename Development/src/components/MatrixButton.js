import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Tooltip, withStyles } from '@material-ui/core';
import {
    decomposeColor,
    fade,
} from '@material-ui/core/styles/colorManipulator';

const alphaOf = color => {
    const { type, values } = decomposeColor(color);
    return type === 'rgba' || type === 'hsla' ? values[3] : 1;
};

// IconButton around an SVG is four extra nodes per cell. Use the
// CheckCircleOutline and RadioButtonUnchecked paths as a mask image
// instead: a matrix can have tens of thousands of these
const glyph = path =>
    `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='${path}'/%3E%3C/svg%3E")`;

const CIRCLE =
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';
const TICK = 'M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8z';
const CHECKED_GLYPH = glyph(TICK + CIRCLE);
const UNCHECKED_GLYPH = glyph(CIRCLE);

// as Material-UI draws an icon and a small icon button around it
const ICON_EXTENT = 24;
const BUTTON_PADDING = 3;

// Material-UI fades a hover by 0.04 in light and 0.08 in dark. A control this
// small on a grid this busy needs the stronger of the two in either theme
const HOVER_OPACITY = 0.08;

// a control reads one step weaker for each thing that makes it less of an
// action to take: unchecked rather than checked, and disabled in Show. The
// steps are Material-UI's own action.active, action.disabled and divider.
// Constraint warnings use those same alphas on the warning colour, so each
// theme de-emphasizes as it does elsewhere.
const styles = theme => {
    const { action, divider, text, type, warning } = theme.palette;
    const warningInk = type === 'light' ? warning.dark : warning.light;
    const warningAt = token =>
        fade(warningInk, alphaOf(token) / alphaOf(action.active));
    return {
        root: {
            alignItems: 'center',
            appearance: 'none',
            background: 'transparent',
            border: 0,
            borderRadius: '50%',
            color: action.active,
            cursor: 'pointer',
            display: 'inline-flex',
            justifyContent: 'center',
            margin: 0,
            padding: BUTTON_PADDING,
            verticalAlign: 'middle',
            transition: theme.transitions.create('background-color', {
                duration: theme.transitions.duration.shortest,
            }),
            '&::before': {
                backgroundColor: 'currentColor',
                content: '""',
                height: ICON_EXTENT,
                width: ICON_EXTENT,
                maskSize: 'cover',
                WebkitMaskSize: 'cover',
            },
            '&::-moz-focus-inner': {
                borderStyle: 'none',
            },
            '&:hover': {
                backgroundColor: fade(text.primary, HOVER_OPACITY),
                '@media (hover: none)': {
                    backgroundColor: 'transparent',
                },
            },
            '&:disabled': {
                color: action.disabled,
                cursor: 'default',
                pointerEvents: 'none',
            },
        },
        checked: {
            '&::before': {
                maskImage: CHECKED_GLYPH,
                WebkitMaskImage: CHECKED_GLYPH,
            },
        },
        unchecked: {
            color: action.disabled,
            '&::before': {
                maskImage: UNCHECKED_GLYPH,
                WebkitMaskImage: UNCHECKED_GLYPH,
            },
            '&:disabled': {
                color: divider,
            },
        },
        constraintWarning: {
            color: warningAt(action.active),
            '&:disabled': {
                color: warningAt(action.disabled),
            },
        },
        constraintWarningUnchecked: {
            color: warningAt(action.disabled),
            '&:disabled': {
                color: warningAt(divider),
            },
        },
        // a pair the records rule out is a ring to look past on every row.
        // Draw it once the pointer is on its cell, or the keyboard is on the
        // control, so it can still be tried
        showOnHover: {
            opacity: 0,
            // leave slower than enter so a sweep leaves a short trail of rings
            transition: [
                theme.transitions.create('background-color', {
                    duration: theme.transitions.duration.shortest,
                }),
                theme.transitions.create('opacity', { duration: 600 }),
            ].join(','),
            '&:focus': {
                opacity: 1,
                transitionDuration: `${theme.transitions.duration.shorter}ms`,
            },
        },
    };
};

const MatrixButton = forwardRef(
    ({ checked, classes, constraintWarning, showOnHover, ...props }, ref) => {
        const warningClass = checked
            ? classes.constraintWarning
            : classes.constraintWarningUnchecked;
        return (
            <button
                className={[
                    classes.root,
                    checked ? classes.checked : classes.unchecked,
                    constraintWarning && warningClass,
                    showOnHover && classes.showOnHover,
                ]
                    .filter(Boolean)
                    .join(' ')}
                ref={ref}
                type="button"
                {...props}
            />
        );
    }
);

// forwardRef leaves the generated class names anonymous otherwise
MatrixButton.displayName = 'MatrixButton';

export default withStyles(styles)(MatrixButton);

// a Tooltip around each of tens of thousands of cells is as costly as the
// button was, and hover state on a cell re-renders the matrix around it, so
// a matrix has one of these beside its table and the cells open it
export const MatrixCellTip = forwardRef(({ disabled }, ref) => {
    const [tip, setTip] = useState(null);

    useImperativeHandle(ref, () => ({
        open: (anchorEl, title) => setTip({ anchorEl, open: true, title }),
        // Material-UI closes an empty tooltip at once, so clearing the title
        // here would draw a bare arrow for the length of the fade out
        close: () => setTip(tip => tip && { ...tip, open: false }),
    }));

    return (
        <Tooltip
            arrow
            disableFocusListener
            disableHoverListener
            disableTouchListener
            open={Boolean(tip && tip.open) && !disabled}
            placement="bottom-start"
            PopperProps={{ anchorEl: tip && tip.anchorEl }}
            title={tip ? tip.title : ''}
        >
            <span />
        </Tooltip>
    );
});

MatrixCellTip.displayName = 'MatrixCellTip';
