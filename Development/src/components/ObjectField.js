import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { get, isEmpty, map } from 'lodash';

export const ObjectField = ({ record, source }) =>
    // no table at all for empty objects
    !isEmpty(get(record, source)) && (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Value(s)</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {map(get(record, source), (value, key) => (
                    <TableRow style={{ fontSize: '14px' }}>
                        <TableCell>{key}</TableCell>
                        {Array.isArray(value) ? (
                            <TableCell>{value.join(', ')}</TableCell>
                        ) : (
                            <TableCell>{value}</TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

ObjectField.defaultProps = {
    addLabel: true,
};

export default ObjectField;
