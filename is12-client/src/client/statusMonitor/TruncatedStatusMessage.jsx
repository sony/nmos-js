import PropTypes from 'prop-types';
import { Box, Tooltip, Typography } from '@mui/material';

const MESSAGE_LINE_HEIGHT = '1.3em';

const ellipsisStyles = {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
};

export default function TruncatedStatusMessage({
    message,
    variant = 'caption',
    color = 'grey.400',
    sx = {},
    placeholder = true,
}) {
    const hasMessage = message !== null && message !== undefined && message !== '';

    const reservedSpaceStyles = placeholder ? { minHeight: MESSAGE_LINE_HEIGHT } : {};

    if (!hasMessage) {
        if (!placeholder) {
            return null;
        }

        return (
            <Typography
                variant={variant}
                aria-hidden="true"
                sx={{
                    ...ellipsisStyles,
                    ...reservedSpaceStyles,
                    ...sx,
                }}
            >
                {'\u00a0'}
            </Typography>
        );
    }

    const messageText = (
        <Typography
            variant={variant}
            color={color}
            sx={{ ...ellipsisStyles, ...reservedSpaceStyles, ...sx }}
        >
            {message}
        </Typography>
    );

    return (
        <Tooltip title={message} arrow placement="top">
            <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
                {messageText}
            </Box>
        </Tooltip>
    );
}

TruncatedStatusMessage.propTypes = {
    message: PropTypes.string,
    variant: PropTypes.string,
    color: PropTypes.string,
    sx: PropTypes.object,
    placeholder: PropTypes.bool,
};
