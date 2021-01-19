import React, { useEffect, useRef, useState } from 'react';
import { IconButton, TextField, Typography } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import DeleteIcon from '@material-ui/icons/Delete';
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import { get, isEmpty, setWith, toPath, unset } from 'lodash';

const unsetCleanly = (object, path) => {
    const pathArray = toPath(path);
    do {
        unset(object, pathArray);
        pathArray.pop();
    } while (!isEmpty(pathArray) && isEmpty(get(object, pathArray)));
};

export const CustomNameField = ({
    defaultValue,
    source,
    label,
    customNames,
    setCustomNames,
    autoFocus,
    displayEditTextField,
    setDisplayEditTextField,
    ...props
}) => {
    const getCustomName = () => get(customNames, source);
    const getName = () => getCustomName() || defaultValue || '';
    const [value, setValue] = useState(getName());

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
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            unsetCleanly(newCustomNames, source);
            return newCustomNames;
        });
    };

    const saveCustomName = () => {
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            // use setWith rather than set to avoid creating arrays if any
            // source path component is a number
            setWith(newCustomNames, source, value, Object);
            return newCustomNames;
        });
        setDisplayEditTextField(false);
    };

    const cancelCustomName = () => {
        setDisplayEditTextField(false);
        setValue(getName());
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
                {getName()}
            </Typography>
            <IconButton
                size="small"
                onClick={() => setDisplayEditTextField(true)}
            >
                <CreateIcon />
            </IconButton>
            {getCustomName() && (
                <IconButton size="small" onClick={removeCustomName}>
                    <DeleteIcon />
                </IconButton>
            )}
        </div>
    );
};

export const EditableIONameField = ({
    deviceId,
    ioResource,
    source,
    ...props
}) => (
    <CustomNameField
        source={`${deviceId}.${ioResource}.${source}.name`}
        {...props}
    />
);

export const EditableChannelLabelField = ({
    deviceId,
    ioResource,
    source,
    channelIndex,
    ...props
}) => (
    <CustomNameField
        source={`${deviceId}.${ioResource}.${source}.channels.${channelIndex}`}
        {...props}
    />
);
