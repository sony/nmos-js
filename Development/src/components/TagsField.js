import React from 'react';
import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@material-ui/core';

function MapTags(record) {
    if (record == null) {
        return null;
    }
    var keys = Object.keys(record.tags);
    var arr = [];
    keys.forEach(key => {
        arr.push({ key: key, value: record.tags[key] });
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
                        <TagField key={item.key} tag={item} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

const TagField = ({ tag = {} }) => (
    <TableRow style={{ fontSize: '14px' }}>
        <TableCell>{tag.key}</TableCell>
        <TableCell>{tag.value.join(', ')}</TableCell>
    </TableRow>
);

TagField.defaultProps = {
    addLabel: true,
    map: [],
};

export default MapTags;
