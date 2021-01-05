import { IconButton } from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

const CollapseButton = ({ onClick, isExpand }) => (
    <IconButton
        size="small"
        title={isExpand ? 'Hide channels' : 'View channels'}
        onClick={onClick}
    >
        {isExpand ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
    </IconButton>
);

export default CollapseButton;
