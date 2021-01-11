import React from 'react';
import { ChipField } from 'react-admin';

export const StyledChipConditionalLabel = ({ record, source }) => (
    <div
        style={{
            margin: 2,
            padding: 2,
        }}
    >
        <ChipConditionalLabel record={record} source={source} />
    </div>
);

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
