import React from 'react';
import {
    Card,
    CardContent,
    Collapse,
    FormControlLabel,
    Button as MaterialButton,
    Snackbar,
    Switch,
    Typography,
} from '@material-ui/core';
import copy from 'clipboard-copy';
import get from 'lodash/get';

const TransportFileViewer = ({ endpoint, ...props }) => {
    const [checked, setChecked] = React.useState(false);
    const [open, setOpen] = React.useState(false);

    const handleChange = () => {
        setChecked(prev => !prev);
    };
    const handleClick = () => {
        copy(get(props.record, `${endpoint}`)).then(() => {
            setOpen(true);
        });
    };
    const handleClose = () => {
        setOpen(false);
    };

    if (!get(props.record, `${endpoint}`)) {
        return null;
    }

    return (
        <div>
            <FormControlLabel
                control={<Switch checked={checked} onChange={handleChange} />}
                label={'Show Transport File'}
            />
            <Collapse in={checked}>
                <Card>
                    <CardContent>
                        <Typography>
                            <pre style={{ fontFamily: 'inherit' }}>
                                {get(props.record, `${endpoint}`)}
                            </pre>
                        </Typography>
                        <MaterialButton
                            variant="contained"
                            color="primary"
                            onClick={handleClick}
                        >
                            Copy
                        </MaterialButton>
                        <Snackbar
                            open={open}
                            onClose={handleClose}
                            autoHideDuration={3000}
                            message={<span>Transport File Copied</span>}
                        />
                    </CardContent>
                </Card>
            </Collapse>
        </div>
    );
};

export default TransportFileViewer;
