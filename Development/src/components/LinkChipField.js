import React from 'react';
import { ChipField } from 'react-admin';

// most NMOS resources that we need to link to have a label property
// which makes a sensible default source, but if it's empty, fall back
// to the id property
const LinkChipField = ({ record, source = 'label', ...props }) => {
    return record ? (
        <ChipField
            clickable={true}
            record={record}
            source={record[source] ? source : 'id'}
            {...props}
        />
    ) : null;
};

export default LinkChipField;
