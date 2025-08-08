import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import { get, isEmpty, map } from 'lodash';
import { Parameter } from './ParameterRegisters';

export const ObjectField = ({ register, record, source }) =>
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
                    <TableRow key={key} style={{ fontSize: '14px' }}>
                        <TableCell>
                            <Parameter register={register} value={key} />
                        </TableCell>
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
