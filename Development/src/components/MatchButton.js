import { IconButton, withStyles } from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import { MATCH_ICON_PADDING, MATCH_ICON_SIZE } from './matrixLayout';

// smaller than the collapse arrow, so the heading name stays the subject
const MatchIconButton = withStyles(theme => ({
    root: {
        color: theme.palette.action.active,
        fontSize: MATCH_ICON_SIZE,
        padding: MATCH_ICON_PADDING,
    },
}))(IconButton);

const MatchButton = ({ disabled, onClick, style, title }) => (
    <MatchIconButton
        disabled={disabled}
        onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            onClick();
        }}
        size="small"
        style={style}
        title={title}
    >
        <FilterListIcon fontSize="inherit" />
    </MatchIconButton>
);

export default MatchButton;
