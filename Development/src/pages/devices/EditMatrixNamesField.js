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

export const EditableIONameField = ({
    defaultValue,
    source,
    label,
    customNames,
    setCustomNames,
    autoFocus,
    ioResource,
    deviceId,
    displayEditTextField,
    setDisplayEditTextField,
    ...props
}) => {
    const getCustomName = () =>
        get(customNames, `${deviceId}.${ioResource}.${source}.name`);

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
            unsetCleanly(
                newCustomNames,
                `${deviceId}.${ioResource}.${source}.name`
            );
            return newCustomNames;
        });
    };

    const saveCustomName = () => {
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            // use setWith rather than set to avoid creating arrays if source is a number
            setWith(
                newCustomNames,
                `${deviceId}.${ioResource}.${source}.name`,
                value,
                Object
            );
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

export const EditableChannelLabelField = ({
    defaultValue,
    source,
    channelIndex,
    label,
    customNames,
    setCustomNames,
    autoFocus,
    ioResource,
    deviceId,
    displayEditTextField,
    setDisplayEditTextField,
    ...props
}) => {
    const getCustomChannelLabel = () =>
        get(
            customNames,
            `${deviceId}.${ioResource}.${source}.channels.${channelIndex}`
        );

    const getChannelLabel = () => getCustomChannelLabel() || defaultValue || '';

    const [value, setValue] = useState(getChannelLabel());

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [autoFocus]);

    const removeCustomChannelLabel = () => {
        setDisplayEditTextField(false);
        setValue(defaultValue);
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            unsetCleanly(
                newCustomNames,
                `${deviceId}.${ioResource}.${source}.channels.${channelIndex}`
            );
            return newCustomNames;
        });
    };

    const saveCustomChannelLabel = () => {
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            // use setWith rather than set to avoid creating arrays if source is a number
            setWith(
                newCustomNames,
                `${deviceId}.${ioResource}.${source}.channels.${channelIndex}`,
                value,
                Object
            );
            return newCustomNames;
        });
        setDisplayEditTextField(false);
    };

    const cancelCustomChannelLabel = () => {
        setDisplayEditTextField(false);
        setValue(getChannelLabel());
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
                {...props}
                onKeyPress={event => {
                    if (event.key === 'Enter') {
                        saveCustomChannelLabel();
                    }
                }}
            />
            <IconButton
                size="small"
                onClick={
                    value === defaultValue
                        ? removeCustomChannelLabel
                        : saveCustomChannelLabel
                }
            >
                <DoneIcon />
            </IconButton>
            <IconButton size="small" onClick={cancelCustomChannelLabel}>
                <ClearIcon />
            </IconButton>
        </div>
    ) : (
        <div>
            <Typography variant="body2" display="inline">
                {getChannelLabel()}
            </Typography>
            <IconButton
                size="small"
                onClick={() => setDisplayEditTextField(true)}
            >
                <CreateIcon />
            </IconButton>
            {getCustomChannelLabel() && (
                <IconButton size="small" onClick={removeCustomChannelLabel}>
                    <DeleteIcon />
                </IconButton>
            )}
        </div>
    );
};
