import React from 'react';
import dayjs from 'dayjs';
import get from 'lodash/get';
import { Typography } from '@material-ui/core';

const TAIField = ({ record, source }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <Typography>{get(record, source)}&emsp;</Typography>
        {get(record, source) != null && (
            <Typography color="textSecondary">
                ({TAIConversion(record, source)})
            </Typography>
        )}
    </div>
);

function TAIConversion(record, source) {
    const taiData = get(record, source);
    if (!taiData) return <b>Conversion Error</b>;
    const sn = taiData.split(':', 2);
    const timestamp = new Date(1e3 * sn[0] + sn[1] / 1e6);
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS');
}

TAIField.defaultProps = {
    addLabel: true,
    source: String,
};

export default TAIField;
