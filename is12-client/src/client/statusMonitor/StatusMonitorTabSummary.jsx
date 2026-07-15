import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import StatusLight from './StatusLight';
import {
    buildStatusMonitorViewModel,
    formatStatusMessage,
    getMonitorDisplayName,
    getOverallStatusPresentation,
} from './statusMonitorUtils';

export default function StatusMonitorTabSummary({ monitors }) {
    return monitors.map((monitor) => {
        const viewModel = buildStatusMonitorViewModel(monitor);
        const { label, color } = getOverallStatusPresentation(viewModel);
        const monitorLabel = getMonitorDisplayName(monitor);

        return (
            <Box
                key={`${monitor.oid}-${monitor.name}`}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
            >
                <StatusLight
                    color={color}
                    size="small"
                    label={`${monitorLabel}: ${label}`}
                    tooltip={formatStatusMessage(viewModel.overallStatusMessage) || undefined}
                />
                <Typography variant="caption" color="text.secondary">
                    {monitorLabel}
                </Typography>
            </Box>
        );
    });
}

StatusMonitorTabSummary.propTypes = {
    monitors: PropTypes.arrayOf(PropTypes.object).isRequired,
};
