import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core';
import get from 'lodash/get';

function MapObject(record, source) {
    if (record == null || !get(record, source)) {
        return;
    }
    const keys = Object.keys(get(record, source));
    let arr = [];
    keys.forEach(key => {
        arr.push({ key: key, value: get(record, source)[key] });
    });
    return (
        <div>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell> Name </TableCell>
                        <TableCell> Value(s)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {arr.map(item => (
                        <ObjectField key={item.key} item={item} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

const ObjectField = ({ item = {} }) => (
    <TableRow style={{ fontSize: '14px' }}>
        <TableCell>{item.key}</TableCell>
        {Array.isArray(item.value) ? (
            <TableCell>{item.value.join(', ')}</TableCell>
        ) : (
            <TableCell>{item.value}</TableCell>
        )}
    </TableRow>
);

ObjectField.defaultProps = {
    addLabel: true,
    map: [],
};

export default MapObject;
