import React from 'react';
import get from 'lodash/get';
import { BooleanField, TextField } from 'react-admin';

// A boolean is a small tick or cross. Any other value is text. null is blank.
const TransportParamField = props => {
    const value = get(props.record, props.source);
    if (typeof value === 'boolean') return <BooleanField {...props} />;
    return <TextField {...props} />;
};

TransportParamField.defaultProps = {
    addLabel: true,
};

export default TransportParamField;
