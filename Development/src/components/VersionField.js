import React from 'react';
import dayjs from 'dayjs';

const VersionField = ({ source, record = {} }) => (
    <span style={{ fontSize: '14px' }}>
        {record[source]}
        &emsp;
        <span style={{ color: 'grey' }}>({VersionConversion(record)})</span>
    </span>
);

function VersionConversion(record) {
    const sn = record.version.split(':', 2);
    const timestamp = new Date(1e3 * sn[0] + sn[1] / 1e6);
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS');
}

VersionField.defaultProps = {
    addLabel: true,
    source: String,
};

export default VersionField;
