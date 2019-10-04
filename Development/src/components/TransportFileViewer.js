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

function transportFileExists(endpoint, props) {
    const str = get(props.record, '$transportfile');
    if (typeof str !== 'string') return true;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type !== '[object Object]' || type !== '[object Array]';
    } catch (err) {
        return true;
    }
}

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

    if (props.resource === 'senders' && !transportFileExists(endpoint, props)) {
        return null;
    }

    if (get(props.record, `${endpoint}`) == null) {
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
