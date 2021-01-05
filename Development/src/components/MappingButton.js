import { IconButton } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';

const MappingButton = ({ disabeld, onClick, isMapped }) => (
    <IconButton disabled={disabeld} onClick={onClick}>
        {isMapped ? <CheckCircleOutlineIcon /> : <RadioButtonUncheckedIcon />}
    </IconButton>
);

export default MappingButton;
