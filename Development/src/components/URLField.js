import React from 'react';
import { Typography } from '@material-ui/core';
import get from 'lodash/get';

const UrlField = ({ source, record = {} }) => (
    <a
        href={get(record, source)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
    >
        <Typography color="textPrimary" style={{ textDecoration: 'underline' }}>
            {get(record, source)}
        </Typography>
    </a>
);
UrlField.defaultProps = {
    addLabel: true,
};

export default UrlField;
