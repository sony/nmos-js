import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import StatusMonitorPanel from './StatusMonitorPanel';

export default function StatusMonitorList({ monitors }) {
    if (!monitors || monitors.length === 0) {
        return null;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {monitors.map((monitor) => (
                <StatusMonitorPanel key={`${monitor.oid}-${monitor.name}`} row={monitor} />
            ))}
        </Box>
    );
}

StatusMonitorList.propTypes = {
    monitors: PropTypes.arrayOf(PropTypes.object).isRequired,
};
