import React from 'react';
import Chip from '@material-ui/core/Chip';
import get from 'lodash/get';

const ChipFunctionalLabel = ({ record, source, labelFunction }) => {
    const value = get(record, source);
    return record && value ? (
        <Chip label={labelFunction(value)} clickable={true} />
    ) : null;
};

export default ChipFunctionalLabel;
