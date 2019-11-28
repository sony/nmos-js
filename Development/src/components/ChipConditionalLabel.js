import React from 'react';
import { ChipField } from 'react-admin';

const ChipConditionalLabel = ({ record, source }) => {
    return record ? (
        record[source] ? (
            <ChipField {...{ record, clickable: true, source }} />
        ) : (
            <ChipField {...{ record, clickable: true, source: 'id' }} />
        )
    ) : null;
};

export default ChipConditionalLabel;
