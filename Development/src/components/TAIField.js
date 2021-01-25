import React from 'react';
import tai from 't-a-i';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import get from 'lodash/get';
import { Typography } from '@material-ui/core';
dayjs.extend(utc);

const InlineTypography = props => (
    <Typography style={{ display: 'inline' }} {...props} />
);

const TAIField = ({ record, source, mode }) => (
    <div>
        <InlineTypography variant="body2">
            {get(record, source)}
        </InlineTypography>
        {get(record, source) != null && (
            <InlineTypography variant="body2" color="textSecondary">
                &ensp;({TAIConversion(record, source, mode)})
            </InlineTypography>
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
