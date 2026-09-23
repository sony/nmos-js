import React, { forwardRef } from 'react';
import { withStyles } from '@material-ui/core';
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
                backgroundColor: fade(text.primary, action.hoverOpacity),
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
    };
};

const MappingButton = forwardRef(
    ({ checked, classes, constraintWarning, ...props }, ref) => {
        const warningClass = checked
            ? classes.constraintWarning
            : classes.constraintWarningUnchecked;
        return (
            <button
                className={[
                    classes.root,
                    checked ? classes.checked : classes.unchecked,
                    constraintWarning && warningClass,
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
MappingButton.displayName = 'MappingButton';

export default withStyles(styles)(MappingButton);
