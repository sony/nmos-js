import React, { useEffect, useRef, useState } from 'react';
import { IconButton, TextField, Typography } from '@material-ui/core';
import get from 'lodash/get';
import has from 'lodash/has';
import CreateIcon from '@material-ui/icons/Create';
import DeleteIcon from '@material-ui/icons/Delete';
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import { isEmpty, set } from 'lodash';

export const EditableIONameField = ({
    defaultValue,
    source,
    label,
    customNames,
    setCustomNames,
    autoFocus,
    ioKey,
    ...props
}) => {
    const [displayRenameField, setDisplayRenameField] = useState(false);
    const [displayEditIcon, setDisplayEditIcon] = useState(true);
    const [value, setValue] = useState(() => {
        if (get(customNames, `${ioKey}.${source}.name`)) {
            return get(customNames, `${ioKey}.${source}.name`);
        } else if (defaultValue != null) {
            return defaultValue;
        } else {
            return '';
        }
    });

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [autoFocus]);

    const getCustomName = () => {
        return get(customNames, `${ioKey}.${source}.name`);
    };

    const getName = () => {
        return getCustomName() || defaultValue;
    };

    const removeCustomName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(defaultValue);
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (has(newCustomNames, `${ioKey}.${source}.name`)) {
                set(newCustomNames, `${ioKey}.${source}.name`, '');
            }
            if (isEmpty(get(newCustomNames, `${ioKey}.${source}.channels`))) {
                delete newCustomNames[source];
            }
            return newCustomNames;
        });
    };

    const saveCustomName = () => {
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (!has(newCustomNames, `${ioKey}`)) {
                set(newCustomNames, `${ioKey}`, {});
            }
            if (value === defaultValue) {
            } else if (!has(newCustomNames, `${ioKey}.${source}`)) {
                set(newCustomNames, `${ioKey}.${source}`, {
                    name: value,
                    channels: {},
                });
            } else {
                set(newCustomNames, `${ioKey}.${source}.name`, value);
            }
            return newCustomNames;
        });
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
    };

    const cancelCustomName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(getName());
    };

    return (
        <div>
            {displayRenameField ? (
                <>
                    <TextField
                        label={label}
                        variant="filled"
                        margin="dense"
                        value={value}
                        onChange={event => setValue(event.target.value)}
                        inputRef={inputRef}
                        fullWidth={true}
                        {...props}
                    />
                    <IconButton size="small" onClick={saveCustomName}>
                        <DoneIcon />
                    </IconButton>
                    <IconButton size="small" onClick={cancelCustomName}>
                        <ClearIcon />
                    </IconButton>
                </>
            ) : (
                <>
                    <Typography variant="body2" display="inline">
                        {getName()}
                    </Typography>
                    {displayEditIcon && (
                        <>
                            <IconButton
                                size="small"
                                onClick={() => setDisplayRenameField(true)}
                            >
                                <CreateIcon />
                            </IconButton>
                            {getCustomName() && (
                                <IconButton
                                    size="small"
                                    onClick={removeCustomName}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </>
                    )}
                </>
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
    ioKey,
    ...props
}) => {
    const [displayRenameField, setDisplayRenameField] = useState(false);
    const [displayEditIcon, setDisplayEditIcon] = useState(true);
    const [value, setValue] = useState(() => {
        if (get(customNames, `${ioKey}.${source}.channels.${channelIndex}`)) {
            return get(
                customNames,
                `${ioKey}.${source}.channels.${channelIndex}`
            );
        } else if (defaultValue != null) {
            return defaultValue;
        } else {
            return '';
        }
    });

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [autoFocus]);

    const getCustomChannelLabel = () => {
        return get(customNames, `${ioKey}.${source}.channels.${channelIndex}`);
    };

    const getChannelLabel = () => {
        return getCustomChannelLabel() || defaultValue;
    };

    const removeCustomChannelLabel = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(defaultValue);
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (
                has(
                    newCustomNames,
                    `${ioKey}.${source}.channels.${channelIndex}`
                )
            ) {
                delete newCustomNames[ioKey][source]['channels'][channelIndex];
            }
            if (
                isEmpty(get(newCustomNames, `${ioKey}.${source}.channels`)) &&
                get(newCustomNames, `${ioKey}.${source}.name`) === ''
            ) {
                delete newCustomNames[ioKey][source];
            }
            return newCustomNames;
        });
    };

    const saveCustomChannelLabel = () => {
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (value !== defaultValue) {
                if (!has(newCustomNames, `${ioKey}.${source}`)) {
                    set(newCustomNames, `${ioKey}.${source}`, {
                        name: '',
                        channels: {},
                    });
                }
                set(
                    newCustomNames,
                    `${ioKey}.${source}.channels.${channelIndex}`,
                    value
                );
            }
            return newCustomNames;
        });
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
    };

    const cancelCustomChannelLabel = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(getChannelLabel());
    };

    return (
        <div>
            {displayRenameField ? (
                <>
                    <TextField
                        label={label}
                        variant="filled"
                        margin="dense"
                        value={value}
                        onChange={event => setValue(event.target.value)}
                        inputRef={inputRef}
                        fullWidth={true}
                        {...props}
                    />
                    <IconButton size="small" onClick={saveCustomChannelLabel}>
                        <DoneIcon />
                    </IconButton>
                    <IconButton size="small" onClick={cancelCustomChannelLabel}>
                        <ClearIcon />
                    </IconButton>
                </>
            ) : (
                <>
                    <Typography variant="body2" display="inline">
                        {getChannelLabel()}
                    </Typography>
                    {displayEditIcon && (
                        <>
                            <IconButton
                                size="small"
                                onClick={() => setDisplayRenameField(true)}
                            >
                                <CreateIcon />
                            </IconButton>
                            {getCustomChannelLabel() && (
                                <IconButton
                                    size="small"
                                    onClick={removeCustomChannelLabel}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};
