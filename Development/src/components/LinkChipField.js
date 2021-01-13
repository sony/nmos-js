import React from 'react';
import { ChipField } from 'react-admin';
import get from 'lodash/get';

// most NMOS resources that we need to link to have a label property
// which makes a sensible default source, but if it's empty, fall back
// to the id property
const LinkChipField = ({
    record,
    source = 'label',
    transform = _ => _,
    ...props
}) => (
    <ChipField
        clickable={true}
        record={{
            _: transform(get(record, source) || get(record, 'id')),
        }}
        source={'_'}
        {...props}
    />
);

export default LinkChipField;
