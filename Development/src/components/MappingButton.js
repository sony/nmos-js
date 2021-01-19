import { IconButton, withStyles } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';

// de-emphasize the unchecked state
const faded = { opacity: 0.3 };

const styles = {
    unchecked: faded,
    checked: {},
};

const MappingButton = ({ checked, ...props }) => (
    <IconButton
        className={checked ? props.classes.checked : props.classes.unchecked}
        {...props}
    >
        {checked ? <CheckCircleOutlineIcon /> : <RadioButtonUncheckedIcon />}
    </IconButton>
);

export default withStyles(styles)(MappingButton);
