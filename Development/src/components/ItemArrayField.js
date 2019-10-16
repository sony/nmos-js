import React from 'react';
import { Typography } from '@material-ui/core';
import get from 'lodash/get';

const ItemArrayField = ({ className, record, source }) => (
    <div>
        {get(record, source).map((item, index) => (
            <Typography key={index} className={className}>
                {item}
            </Typography>
        ))}
    </div>
);
ItemArrayField.defaultProps = {
    addLabel: true,
};

export default ItemArrayField;
