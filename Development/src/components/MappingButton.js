import { IconButton, withStyles } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';

// de-emphasize the unchecked state
const faded = { opacity: 0.3 };

const styles = theme => ({
    unchecked: faded,
    constraintWarning: {
        color:
            theme.palette.type === 'light'
                ? theme.palette.warning.dark
                : theme.palette.warning.light,
    },
    constraintWarningUnchecked: { opacity: 0.5 },
    checked: {},
});

// filter out our classes to avoid the Material-UI console warning
const MappingButton = ({
    checked,
    constraintWarning,
    classes: {
        checked: checkedClass,
        constraintWarning: constraintWarningClass,
        constraintWarningUnchecked: constraintWarningUncheckedClass,
        unchecked: uncheckedClass,
        ...inheritedClasses
    },
    ...props
}) => {
    const stateClass = checked
        ? checkedClass
        : constraintWarning
          ? constraintWarningUncheckedClass
          : uncheckedClass;
    const className = [stateClass, constraintWarning && constraintWarningClass]
        .filter(Boolean)
        .join(' ');

    return (
        <IconButton className={className} classes={inheritedClasses} {...props}>
            {checked ? (
                <CheckCircleOutlineIcon />
            ) : (
                <RadioButtonUncheckedIcon />
            )}
        </IconButton>
    );
};

export default withStyles(styles)(MappingButton);
