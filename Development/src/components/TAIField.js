import React from 'react';
import dayjs from 'dayjs';
import get from 'lodash/get';

const TAIField = ({ record, source = {} }) => (
    <span style={{ fontSize: '14px' }}>
        {record[source]}
        {get(record, source) != null && (
            <span style={{ color: 'grey' }}>
                {' '}
                ({TAIConversion(record, source)})
            </span>
        )}
    </span>
);

function TAIConversion(record, source) {
    const taiData = get(record, `${source}`);
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
