import PropTypes from 'prop-types';
import { Box, Tooltip } from '@mui/material';

const TRAFFIC_LIGHT_COLORS = {
    green: '#2ecc71',
    amber: '#f39c12',
    red: '#e74c3c',
    neutral: '#95a5a6',
    unknown: '#7f8c8d',
};

export default function StatusLight({ color, size = 'medium', label, tooltip }) {
    const diameter = size === 'large' ? 28 : size === 'small' ? 12 : 16;

    const light = (
        <Box
            aria-label={label}
            sx={{
                width: diameter,
                height: diameter,
                minWidth: diameter,
                borderRadius: '50%',
                backgroundColor: TRAFFIC_LIGHT_COLORS[color] || TRAFFIC_LIGHT_COLORS.unknown,
                border: '1px solid rgba(255, 255, 255, 0.35)',
                boxShadow: color === 'neutral' || color === 'unknown'
                    ? 'none'
                    : `0 0 8px ${TRAFFIC_LIGHT_COLORS[color]}`,
            }}
        />
    );

    if (tooltip) {
        return (
            <Tooltip title={tooltip} arrow>
                {light}
            </Tooltip>
        );
    }

    return light;
}

StatusLight.propTypes = {
    color: PropTypes.oneOf(['green', 'amber', 'red', 'neutral', 'unknown']).isRequired,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    label: PropTypes.string,
    tooltip: PropTypes.string,
};
