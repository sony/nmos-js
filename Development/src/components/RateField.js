import React from 'react';
import get from 'lodash/get';
import { Typography } from '@material-ui/core';

const RateField = ({ record, source }) => {
    const rate = get(record, source);
    if (!rate) {
        return <Typography variant="body2" />;
    }
    return (
        <Typography variant="body2">
            {rate.numerator} : {rate.denominator ? rate.denominator : 1}
        </Typography>
    );
};

RateField.defaultProps = {
    addLabel: true,
};

export default RateField;
