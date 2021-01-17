import React, { useEffect, useRef, useState } from 'react';
import { IconButton, TextField, Typography } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import DeleteIcon from '@material-ui/icons/Delete';
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import { get, has, isEmpty, set } from 'lodash';

export const EditableIONameField = ({
    defaultValue,
    source,
    label,
    customNames,
    setCustomNames,
    autoFocus,
    ioKey,
    deviceID,
    displayEditTextField,
    setDisplayEditTextField,
    ...props
}) => {
    const [value, setValue] = useState(() => {
        if (get(customNames, `${deviceID}.${ioKey}.${source}.name`)) {
            return get(customNames, `${deviceID}.${ioKey}.${source}.name`);
        } else if (defaultValue != null) {
            return defaultValue;
        } else {
            return '';
        }
    });

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (displayEditTextField) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [autoFocus, displayEditTextField]);

    const getCustomName = () => {
        return get(customNames, `${deviceID}.${ioKey}.${source}.name`);
    };

    const getName = () => {
        return getCustomName() || defaultValue;
    };

    const removeCustomName = () => {
        setDisplayEditTextField(false);
        setValue(defaultValue);
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (has(newCustomNames, `${deviceID}.${ioKey}.${source}.name`)) {
                set(newCustomNames, `${deviceID}.${ioKey}.${source}.name`, '');
            }
            if (
                isEmpty(
                    get(
                        newCustomNames,
                        `${deviceID}.${ioKey}.${source}.channels`
                    )
                )
            ) {
                delete newCustomNames[deviceID][source];
            }
            return newCustomNames;
        });
    };

    const saveCustomName = () => {
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (!has(newCustomNames, `${deviceID}`)) {
                set(newCustomNames, `${deviceID}`, {});
            }
            if (!has(newCustomNames, `${deviceID}.${ioKey}`)) {
                set(newCustomNames, `${deviceID}.${ioKey}`, {});
            }
            if (!has(newCustomNames, `${deviceID}.${ioKey}.${source}`)) {
                set(newCustomNames, `${deviceID}.${ioKey}.${source}`, {
                    name: value,
                    channels: {},
                });
            }
            set(newCustomNames, `${deviceID}.${ioKey}.${source}.name`, value);
            return newCustomNames;
        });
        setDisplayEditTextField(false);
    };

    const cancelCustomName = () => {
        setDisplayEditTextField(false);
        setValue(getName());
    };

    return (
        <div>
            {displayEditTextField ? (
                <>
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
                            value === defaultValue
                                ? removeCustomName
                                : saveCustomName
                        }
                    >
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
                    {!displayEditTextField && (
                        <>
                            <IconButton
                                size="small"
                                onClick={() => setDisplayEditTextField(true)}
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
    deviceID,
    displayEditTextField,
    setDisplayEditTextField,
    ...props
}) => {
    const [value, setValue] = useState(() => {
        if (
            get(
                customNames,
                `${deviceID}.${ioKey}.${source}.channels.${channelIndex}`
            )
        ) {
            return get(
                customNames,
                `${deviceID}.${ioKey}.${source}.channels.${channelIndex}`
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
        return get(
            customNames,
            `${deviceID}.${ioKey}.${source}.channels.${channelIndex}`
        );
    };

    const getChannelLabel = () => {
        return getCustomChannelLabel() || defaultValue;
    };

    const removeCustomChannelLabel = () => {
        setDisplayEditTextField(false);
        setValue(defaultValue);
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (
                has(
                    newCustomNames,
                    `${deviceID}.${ioKey}.${source}.channels.${channelIndex}`
                )
            ) {
                delete newCustomNames[deviceID][ioKey][source]['channels'][
                    channelIndex
                ];
            }
            if (
                isEmpty(
                    get(
                        newCustomNames,
                        `${deviceID}.${ioKey}.${source}.channels`
                    )
                ) &&
                get(newCustomNames, `${deviceID}.${ioKey}.${source}.name`) ===
                    ''
            ) {
                delete newCustomNames[ioKey][source];
            }
            return newCustomNames;
        });
    };

    const saveCustomChannelLabel = () => {
        setCustomNames(f => {
            let newCustomNames = { ...f };
            if (!has(newCustomNames, `${deviceID}.${ioKey}`)) {
                set(newCustomNames, `${deviceID}.${ioKey}`, {});
            }
            if (!has(newCustomNames, `${deviceID}.${ioKey}.${source}`)) {
                set(newCustomNames, `${deviceID}.${ioKey}.${source}`, {
                    name: '',
                    channels: {},
                });
            }
            set(
                newCustomNames,
                `${deviceID}.${ioKey}.${source}.channels.${channelIndex}`,
                value
            );
            return newCustomNames;
        });
        setDisplayEditTextField(false);
    };

    const cancelCustomChannelLabel = () => {
        setDisplayEditTextField(false);
        setValue(getChannelLabel());
    };

    return (
        <div>
            {displayEditTextField ? (
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
                </>
            ) : (
                <>
                    <Typography variant="body2" display="inline">
                        {getChannelLabel()}
                    </Typography>
                    {!displayEditTextField && (
                        <>
                            <IconButton
                                size="small"
                                onClick={() => setDisplayEditTextField(true)}
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
