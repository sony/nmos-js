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
    personalNames,
    setPersonalNames,
    autoFocus,
    ioKey,
    ...props
}) => {
    const [displayRenameField, setDisplayRenameField] = useState(false);
    const [displayEditIcon, setDisplayEditIcon] = useState(true);
    const [value, setValue] = useState(() => {
        if (get(personalNames, `${ioKey}.${source}.name`)) {
            return get(personalNames, `${ioKey}.${source}.name`);
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
        return () => {
            clearTimeout(timeout);
        };
    }, [autoFocus]);

    const getName = () => {
        return get(personalNames, `${ioKey}.${source}.name`);
    };

    const getDisplayedName = () => {
        return getName() || defaultValue;
    };

    const removeOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(defaultValue);
        setPersonalNames(f => {
            let newpersonalNames = { ...f };
            if (has(newpersonalNames, `${ioKey}.${source}.name`)) {
                set(newpersonalNames, `${ioKey}.${source}.name`, '');
            }
            if (isEmpty(get(newpersonalNames, `${ioKey}.${source}.channels`))) {
                delete newpersonalNames[source];
            }
            return newpersonalNames;
        });
    };

    const saveOverrideName = () => {
        setPersonalNames(f => {
            let newpersonalNames = { ...f };
            if (!has(newpersonalNames, `${ioKey}`)) {
                set(newpersonalNames, `${ioKey}`, {});
            }
            if (value === defaultValue) {
            } else if (!has(newpersonalNames, `${ioKey}.${source}`)) {
                set(newpersonalNames, `${ioKey}.${source}`, {
                    name: value,
                    channels: {},
                });
            } else {
                set(newpersonalNames, `${ioKey}.${source}.name`, value);
            }
            return newpersonalNames;
        });
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
    };

    const cancleOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(getDisplayedName());
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
                    <IconButton size="small" onClick={() => saveOverrideName()}>
                        <DoneIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => cancleOverrideName()}
                    >
                        <ClearIcon />
                    </IconButton>
                </>
            ) : (
                <>
                    <Typography variant="body2" display="inline">
                        {getDisplayedName()}
                    </Typography>
                    {displayEditIcon && (
                        <>
                            <IconButton
                                size="small"
                                onClick={() => setDisplayRenameField(true)}
                            >
                                <CreateIcon />
                            </IconButton>
                            {getName() && (
                                <IconButton
                                    size="small"
                                    onClick={() => removeOverrideName()}
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

export const EditableChannelNameField = ({
    defaultValue,
    source,
    channelIndex,
    label,
    personalNames,
    setPersonalNames,
    autoFocus,
    ioKey,
    ...props
}) => {
    const [displayRenameField, setDisplayRenameField] = useState(false);
    const [displayEditIcon, setDisplayEditIcon] = useState(true);
    const [value, setValue] = useState(() => {
        if (has(personalNames, `${ioKey}.${source}.channels.${channelIndex}`)) {
            return get(
                personalNames,
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
        return () => {
            clearTimeout(timeout);
        };
    }, [autoFocus]);

    const getPersonalChannelName = () => {
        return get(
            personalNames,
            `${ioKey}.${source}.channels.${channelIndex}`
        );
    };

    const getChannelName = () => {
        return getPersonalChannelName() || defaultValue;
    };

    const removeOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(defaultValue);
        setPersonalNames(f => {
            let newPersonalNames = { ...f };
            if (
                has(
                    newPersonalNames,
                    `${ioKey}.${source}.channels.${channelIndex}`
                )
            ) {
                delete newPersonalNames[ioKey][source]['channels'][
                    channelIndex
                ];
            }
            if (
                isEmpty(get(newPersonalNames, `${ioKey}.${source}.channels`)) &&
                get(newPersonalNames, `${ioKey}.${source}.name`) === ''
            ) {
                delete newPersonalNames[ioKey][source];
            }
            return newPersonalNames;
        });
    };

    const saveOverrideName = () => {
        setPersonalNames(f => {
            let newpersonalNames = { ...f };
            if (value !== defaultValue) {
                if (!has(newpersonalNames, `${ioKey}.${source}`)) {
                    set(newpersonalNames, `${ioKey}.${source}`, {
                        name: '',
                        channels: {},
                    });
                }
                set(
                    newpersonalNames,
                    `${ioKey}.${source}.channels.${channelIndex}`,
                    value
                );
            }
            return newpersonalNames;
        });
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
    };

    const cancleOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(true);
        setValue(getChannelName());
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
                    <IconButton size="small" onClick={() => saveOverrideName()}>
                        <DoneIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => cancleOverrideName()}
                    >
                        <ClearIcon />
                    </IconButton>
                </>
            ) : (
                <>
                    <Typography variant="body2" display="inline">
                        {getChannelName()}
                    </Typography>
                    {displayEditIcon && (
                        <>
                            <IconButton
                                size="small"
                                onClick={() => setDisplayRenameField(true)}
                            >
                                <CreateIcon />
                            </IconButton>
                            {getPersonalChannelName() && (
                                <IconButton
                                    size="small"
                                    onClick={() => removeOverrideName()}
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
