import React from 'react';
import {
    Card,
    CardContent,
    Collapse,
    FormControlLabel,
    Switch,
} from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import get from 'lodash/get';
import ReactJson from 'react-json-view';

// Base16 dark theme color palette
const rjvDark = {
    base00: 'rgba(0, 0, 0, 0)',
    base01: '#282828',
    base02: '#383838',
    base03: '#585858',
    base04: '#b8b8b8',
    base05: '#d8d8d8',
    base06: '#e8e8e8',
    base07: '#f8f8f8',
    base08: '#be4b3c',
    base09: '#dc9656',
    base0A: '#f7ca88',
    base0B: '#a1b56c',
    base0C: '#86c1b9',
    base0D: '#a16946',
    base0E: '#aa759f',
    base0F: '#7cafc2',
};

export default function JSONViewer({ endpoint, ...controllerProps }) {
    const [checked, setChecked] = React.useState(false);
    const handleChange = () => {
        setChecked(prev => !prev);
    };
    const theme = useTheme();
    let rjvTheme;
    if (theme.palette.type === 'dark') {
        rjvTheme = rjvDark;
    } else rjvTheme = 'rjv-default';

    return (
        <>
            <FormControlLabel
                control={<Switch checked={checked} onChange={handleChange} />}
                label={'Show JSON'}
            />
            <Collapse in={checked}>
                <Card>
                    <CardContent>
                        <ReactJson
                            src={get(controllerProps.record, endpoint)}
                            theme={rjvTheme}
                        />
                    </CardContent>
                </Card>
            </Collapse>
        </>
    );
}
