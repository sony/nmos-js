import React, { useEffect, useRef, useState } from 'react';
import { IconButton, TextField, Typography } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import DeleteIcon from '@material-ui/icons/Delete';
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import { useCustomNamesContext } from './useCustomNamesContext';

export const CustomNameField = ({
    defaultValue,
    source,
    label,
    autoFocus,
    displayEditTextField,
    setDisplayEditTextField,
    ...props
}) => {
    const {
        getCustomName,
        setCustomName,
        unsetCustomName,
    } = useCustomNamesContext();
    const [value, setValue] = useState(
        getCustomName(source) || defaultValue || ''
    );

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (displayEditTextField) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [autoFocus, displayEditTextField]);

    const removeCustomName = () => {
        setDisplayEditTextField(false);
        setValue(defaultValue);
        unsetCustomName(source);
    };

    const saveCustomName = () => {
        setCustomName(source, value);
        setDisplayEditTextField(false);
    };

    const cancelCustomName = () => {
        setDisplayEditTextField(false);
        setValue(getCustomName(source) || defaultValue || '');
    };

    return displayEditTextField ? (
        <div>
            <TextField
                label={label}
                variant="filled"
                margin="dense"
                value={value}
                onChange={event => setValue(event.target.value)}
                inputRef={inputRef}
                fullWidth={true}
                onKeyPress={event => {
                    if (event.key === 'Enter') {
                        saveCustomName();
                    }
                }}
                {...props}
            />
            <IconButton
                size="small"
                onClick={
                    value === defaultValue ? removeCustomName : saveCustomName
                }
            >
                <DoneIcon />
            </IconButton>
            <IconButton size="small" onClick={cancelCustomName}>
                <ClearIcon />
            </IconButton>
        </div>
    ) : (
        <div>
            <Typography variant="body2" display="inline">
                {value}
            </Typography>
            <IconButton
                size="small"
                onClick={() => setDisplayEditTextField(true)}
            >
                <CreateIcon />
            </IconButton>
            {getCustomName(source) && (
                <IconButton size="small" onClick={removeCustomName}>
                    <DeleteIcon />
                </IconButton>
            )}
        </div>
    );
};

export default CustomNameField;
