import React from 'react';
import Chip from '@material-ui/core/Chip';
import get from 'lodash/get';

const ChipFanctionalLabel = ({ record, source, getLabelByLenght }) => {
    const value = get(record, source);
    return record && value ? (
        <Chip label={getLabelByLenght(value)} clickable={true} />
    ) : null;
};

export default ChipFanctionalLabel;
