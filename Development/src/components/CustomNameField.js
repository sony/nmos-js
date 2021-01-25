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
    onEditStarted,
    onEditStopped,
    ...props
}) => {
    const {
        getCustomName,
        setCustomName,
        unsetCustomName,
    } = useCustomNamesContext();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(
        getCustomName(source) || defaultValue || ''
    );

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus && editing) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [autoFocus, editing]);

    const handleEdit = () => {
        setEditing(true);
        onEditStarted();
    };

    const removeCustomName = () => {
        setValue(defaultValue);
        unsetCustomName(source);
        setEditing(false);
        onEditStopped();
    };

    const saveCustomName = () => {
        if (value !== defaultValue) {
            setCustomName(source, value);
        } else {
            unsetCustomName(source);
        }
        setEditing(false);
        onEditStopped();
    };

    const cancelCustomName = () => {
        setValue(getCustomName(source) || defaultValue || '');
        setEditing(false);
        onEditStopped();
    };

    return editing ? (
        <div>
            <TextField
                label={label}
                variant="filled"
                margin="dense"
                value={value}
                onChange={event => setValue(event.target.value)}
                onFocus={event => event.target.select()}
                inputRef={inputRef}
                fullWidth={true}
                onKeyPress={event => {
                    if (event.key === 'Enter') {
                        saveCustomName();
                    }
                }}
                {...props}
            />
            <IconButton size="small" onClick={saveCustomName}>
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
            <IconButton size="small" onClick={handleEdit}>
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
