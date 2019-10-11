import {
    Card,
    CardContent,
    Collapse,
    FormControlLabel,
    Switch,
} from '@material-ui/core';
import get from 'lodash/get';
import React from 'react';
import ReactJson from 'react-json-view';

export default function JSONViewer({ endpoint, ...controllerProps }) {
    const [checked, setChecked] = React.useState(false);
    const handleChange = () => {
        setChecked(prev => !prev);
    };
    return (
        <div>
            <FormControlLabel
                control={<Switch checked={checked} onChange={handleChange} />}
                label={'Show JSON'}
            />
            <Collapse in={checked}>
                <Card>
                    <CardContent>
                        <ReactJson
                            src={get(controllerProps.record, endpoint)}
                        />
                    </CardContent>
                </Card>
            </Collapse>
        </div>
    );
}
