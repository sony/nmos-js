import React from 'react';
import { Divider } from '@material-ui/core';
import sanitizeRestProps from './sanitizeRestProps';

// Passing react-admin props causes console spam
export const SanitizedDivider = ({ ...rest }) => (
    <Divider {...sanitizeRestProps(rest)} />
);

export default SanitizedDivider;
