import PropTypes from 'prop-types';
import { useState } from 'react';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
    Box,
    Collapse,
    Grid,
    IconButton,
    Typography,
} from '@mui/material';

export default function CollapsibleMonitorSection({ title, ariaLabel, children }) {
    const [open, setOpen] = useState(false);

    return (
        <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: 'flex', bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider', alignItems: 'center' }}>
                <Grid>
                    <IconButton
                        aria-label={ariaLabel}
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </Grid>
                <Grid>
                    <Typography component="h4" variant="subtitle2" color="text.primary" gutterBottom sx={{ mb: 0 }}>
                        {title}
                    </Typography>
                </Grid>
            </Box>
            <Collapse in={open} timeout="auto" unmountOnExit>
                {children}
            </Collapse>
        </Box>
    );
}

CollapsibleMonitorSection.propTypes = {
    title: PropTypes.string.isRequired,
    ariaLabel: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};
