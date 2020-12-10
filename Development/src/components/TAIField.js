import React from 'react';
import tai from 't-a-i';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import get from 'lodash/get';
import { Typography } from '@material-ui/core';
dayjs.extend(utc);

const TAIField = ({ record, source, mode }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <Typography variant="body2">{get(record, source)}&emsp;</Typography>
        {get(record, source) != null && (
            <Typography variant="body2" color="textSecondary">
                ({TAIConversion(record, source, mode)})
            </Typography>
        )}
    </div>
);

const TAIConversion = (record, source, mode) => {
    try {
        const taiData = get(record, source).split(':', 2);
        const taiTimeMilliseconds = 1e3 * taiData[0] + taiData[1] / 1e6;
        if (get(record, mode) === 'activate_scheduled_relative') {
            return dayjs(taiTimeMilliseconds).utc().format('HH:mm:ss.SSS');
        }
        const unixTimeMilliseconds = tai.atomicToUnix(taiTimeMilliseconds);
        return dayjs(unixTimeMilliseconds).format('YYYY-MM-DD HH:mm:ss.SSS Z');
    } catch (e) {
        return `Conversion Error - ${e}`;
    }
};

TAIField.defaultProps = {
    addLabel: true,
    source: String,
};

export default TAIField;
