import { IconButton, withStyles } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import {
    decomposeColor,
    fade,
} from '@material-ui/core/styles/colorManipulator';

const alphaOf = color => {
    const { type, values } = decomposeColor(color);
    return type === 'rgba' || type === 'hsla' ? values[3] : 1;
};

// a control reads one step weaker for each thing that makes it less of an
// action to take: unchecked rather than checked, and disabled in Show. The
// steps are Material-UI's own action.active, action.disabled and divider.
// Constraint warnings use those same alphas on the warning colour, so each
// theme de-emphasizes as it does elsewhere.
const styles = theme => {
    const { action, divider, type, warning } = theme.palette;
    const warningInk = type === 'light' ? warning.dark : warning.light;
    const warningAt = token =>
        fade(warningInk, alphaOf(token) / alphaOf(action.active));
    return {
        unchecked: {
            color: action.disabled,
            '&.Mui-disabled': {
                color: divider,
            },
        },
        constraintWarning: {
            color: warningAt(action.active),
            '&.Mui-disabled': {
                color: warningAt(action.disabled),
            },
        },
        constraintWarningUnchecked: {
            color: warningAt(action.disabled),
            '&.Mui-disabled': {
                color: warningAt(divider),
            },
        },
    };
};

// filter out our classes to avoid the Material-UI console warning
const MappingButton = ({
    checked,
    constraintWarning,
    classes: {
        constraintWarning: constraintWarningClass,
        constraintWarningUnchecked: constraintWarningUncheckedClass,
        unchecked: uncheckedClass,
        ...inheritedClasses
    },
    ...props
}) => {
    const stateClass = constraintWarning
        ? checked
            ? constraintWarningClass
            : constraintWarningUncheckedClass
        : !checked && uncheckedClass;

    return (
        <IconButton
            size="small"
            className={stateClass || undefined}
            classes={inheritedClasses}
            {...props}
        >
            {checked ? (
                <CheckCircleOutlineIcon />
            ) : (
                <RadioButtonUncheckedIcon />
            )}
        </IconButton>
    );
};

export default withStyles(styles)(MappingButton);
