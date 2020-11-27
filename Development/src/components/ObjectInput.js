import React, { useEffect, useState } from 'react';
import { FieldTitle, isRequired } from 'react-admin';
import { useField, useForm } from 'react-final-form';
import {
    FilledInput,
    IconButton,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableRow,
    withStyles,
} from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';

const TableInput = withStyles(() => {
    return {
        input: {
            padding: '6px 10px',
        },
    };
})(FilledInput);

const ObjectInput = ({
    className,
    label,
    record,
    resource,
    source,
    validate,
    variant,
    margin = 'dense',
    ...rest
}) => {
    const fieldProps = useField(source, {
        initialValue: undefined,
        ...rest,
    });
    const formProps = useForm();
    const { change } = formProps;
    const [data, setData] = useState(() => {
        let initialData = [];
        for (const key of Object.keys(fieldProps.input.value)) {
            initialData.push([key, fieldProps.input.value[key]]);
        }
        return initialData;
    });
    const keys = data.map(keyValuePair => keyValuePair[0]);

    useEffect(() => {
        let dataObject = {};
        for (const keyValuePair of data) {
            dataObject[keyValuePair[0]] = keyValuePair[1];
        }
        change(source, dataObject);
    }, [data, change, source]);

    const changeKey = (event, index) => {
        const {
            target: { value },
        } = event;
        let newData = [...data];
        newData[index][0] = value;
        setData(newData);
    };

    const changeValue = (event, index) => {
        const {
            target: { value },
        } = event;
        let newData = [...data];
        newData[index][1] = value;
        setData(newData);
    };

    const removeKey = index => {
        let newData = [...data];
        newData.splice(index, 1);
        setData(newData);
    };

    const addKey = () => {
        let newData = [...data];
        newData.push(['', '']);
        setData(newData);
    };

    const isUnique = value => {
        let count = 0;
        for (const keyValuePair of data) {
            if (keyValuePair[0] === value) count++;
        }
        return count <= 1;
    };

    if (data) {
        if (keys) {
            return (
                <>
                    <br />
                    <InputLabel htmlFor={source} shrink>
                        <FieldTitle
                            label={label}
                            source={source}
                            resource={resource}
                            isRequired={isRequired(validate)}
                        />
                    </InputLabel>
                    <Table size="small" style={{ width: 'auto' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {keys.map((key, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <TableInput
                                            id="name"
                                            value={data[index][0]}
                                            error={!isUnique(data[index][0])}
                                            onChange={e => changeKey(e, index)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TableInput
                                            id="value"
                                            value={data[index][1]}
                                            onChange={e =>
                                                changeValue(e, index)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => removeKey(index)}
                                        >
                                            <RemoveCircleOutlineIcon
                                                color="error"
                                                fontSize="small"
                                            />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell>
                                    <IconButton size="small" onClick={addKey}>
                                        <AddCircleOutlineIcon
                                            color="primary"
                                            fontSize="small"
                                        />
                                    </IconButton>
                                </TableCell>
                                <TableCell />
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </>
            );
        } else {
            return null;
        }
    } else {
        return null;
    }
};

export default ObjectInput;
