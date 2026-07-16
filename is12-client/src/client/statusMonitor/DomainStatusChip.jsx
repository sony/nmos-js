import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import StatusLight from './StatusLight';
import TruncatedStatusMessage from './TruncatedStatusMessage';
import {
    formatStatusMessage,
    getEnumLabel,
    getTrafficLightColor,
    getTransitionCounterValue,
} from './statusMonitorUtils';

export default function DomainStatusChip({ domain }) {
    const statusLabel = getEnumLabel(domain.statusHolder);
    const trafficLightColor = getTrafficLightColor(statusLabel);
    const message = formatStatusMessage(domain.messageHolder);
    const counterValue = getTransitionCounterValue(domain.counterHolder);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                minWidth: 160,
                flex: '1 1 160px',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: 1,
                borderColor: 'divider',
            }}
        >
            <StatusLight
                color={trafficLightColor}
                size="small"
                label={`${domain.label}: ${statusLabel}`}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                    {domain.label}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {statusLabel}
                </Typography>
                <TruncatedStatusMessage
                    message={message}
                    sx={{ mt: 0.25, lineHeight: 1.3 }}
                />
            </Box>
            {counterValue !== null ? (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: '1.5rem', textAlign: 'right', pt: 0.25 }}
                    title={`${domain.label} transition counter`}
                >
                    {counterValue}
                </Typography>
            ) : null}
        </Box>
    );
}

DomainStatusChip.propTypes = {
    domain: PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        statusHolder: PropTypes.object.isRequired,
        messageHolder: PropTypes.object,
        counterHolder: PropTypes.object,
    }).isRequired,
};
