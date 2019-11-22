import React from 'react';
import { Typography } from '@material-ui/core';
import get from 'lodash/get';

const URLField = ({ record, source }) => (
    <a
        href={get(record, source)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
    >
        <Typography
            color="textPrimary"
            component="span"
            variant="body2"
            style={{ textDecoration: 'underline' }}
        >
            {get(record, source)}
        </Typography>
    </a>
);
URLField.defaultProps = {
    addLabel: true,
};

export default URLField;
