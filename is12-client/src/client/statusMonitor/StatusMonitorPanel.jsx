import PropTypes from 'prop-types';
import { useState } from 'react';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
    Box,
    Collapse,
    IconButton,
    Typography,
} from '@mui/material';
import StatusLight from './StatusLight';
import DomainStatusChip from './DomainStatusChip';
import StatusMonitorMethodsPanel from './StatusMonitorMethodsPanel';
import StatusMonitorSettingsGrid from './StatusMonitorSettingsGrid';
import TruncatedStatusMessage from './TruncatedStatusMessage';
import {
    buildStatusMonitorViewModel,
    getMonitorDisplayName,
    getOverallStatusPresentation,
} from './statusMonitorUtils';

export default function StatusMonitorPanel({ row }) {
    const [expanded, setExpanded] = useState(false);
    const viewModel = buildStatusMonitorViewModel(row);
    const { label: overallLabel, color: overallColor, message: overallMessage } = getOverallStatusPresentation(viewModel);

    return (
        <Box
            sx={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                bgcolor: '#1a2328',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto auto minmax(0, 1fr) 8.5rem minmax(8rem, 1.5fr)',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1,
                    py: 1,
                    cursor: 'pointer',
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <IconButton
                    aria-label={expanded ? 'collapse monitor' : 'expand monitor'}
                    size="small"
                    onClick={(event) => {
                        event.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>

                <StatusLight
                    color={overallColor}
                    size="large"
                    label={`Overall status: ${overallLabel}`}
                />

                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" color="white" sx={{ lineHeight: 1.2 }}>
                        {getMonitorDisplayName(row)}
                    </Typography>
                    <Typography variant="caption" color="grey.400" sx={{ lineHeight: 1.2 }}>
                        {row.description || row.name}
                    </Typography>
                </Box>

                <Typography
                    variant="body2"
                    color="grey.300"
                    sx={{
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {overallLabel}
                </Typography>

                <TruncatedStatusMessage
                    message={overallMessage}
                    sx={{ textAlign: 'right', lineHeight: 1.3 }}
                />
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {viewModel.domains.map((domain) => (
                            <DomainStatusChip key={domain.key} domain={domain} />
                        ))}
                    </Box>

                    <StatusMonitorSettingsGrid
                        settingsProperties={viewModel.settingsProperties}
                        oid={row.oid}
                    />

                    <StatusMonitorMethodsPanel row={row} />
                </Box>
            </Collapse>
        </Box>
    );
}

StatusMonitorPanel.propTypes = {
    row: PropTypes.object.isRequired,
};
