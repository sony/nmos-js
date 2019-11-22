import React from 'react';
import { ChipField } from 'react-admin';

const ChipConditionalLabel = ({ record, source, ...props }) => {
    props.clickable = true;
    return record ? (
        record[source] ? (
            <ChipField {...{ record, clickable: true, source }} />
        ) : (
            <ChipField {...{ record, clickable: true, source: 'id' }} />
        )
    ) : null;
};

export default ChipConditionalLabel;
