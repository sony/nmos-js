import { IconButton } from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

const CollapseButton = ({
    onClick,
    isExpanded,
    direction = 'vertical',
    title,
}) => (
    <IconButton size="small" title={title} onClick={onClick}>
        {direction === 'horizontal' ? (
            isExpanded ? (
                <KeyboardArrowLeftIcon />
            ) : (
                <KeyboardArrowRightIcon />
            )
        ) : isExpanded ? (
            <KeyboardArrowUpIcon />
        ) : (
            <KeyboardArrowDownIcon />
        )}
    </IconButton>
);

export default CollapseButton;
