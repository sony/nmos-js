import { IconButton, withStyles } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';

// de-emphasize the unchecked state
const faded = { opacity: 0.3 };

const styles = {
    unchecked: faded,
    checked: {},
};

// filter out our classes to avoid the Material-UI console warning
const MappingButton = ({
    checked,
    classes: {
        checked: checkedClass,
        unchecked: uncheckedClass,
        ...inheritedClasses
    },
    ...props
}) => (
    <IconButton
        className={checked ? checkedClass : uncheckedClass}
        classes={inheritedClasses}
        {...props}
    >
        {checked ? <CheckCircleOutlineIcon /> : <RadioButtonUncheckedIcon />}
    </IconButton>
);

export default withStyles(styles)(MappingButton);
