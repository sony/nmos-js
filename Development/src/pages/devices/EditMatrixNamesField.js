import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Button, IconButton, TextField, Tooltip } from '@material-ui/core';
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
    getLabelByLenght,
    title,
    ioKey,
    ...props
}) => {
    const [displayRenameField, setDisplayRenameField] = useState(false);
    const [displayEditIcon, setDisplayEditIcon] = useState(false);
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
        return get(personalNames, `${ioKey}.${source}.name`)
            ? getLabelByLenght(get(personalNames, `${ioKey}.${source}.name`))
            : getLabelByLenght(defaultValue);
    };

    const removeOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(false);
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
        setDisplayEditIcon(false);
    };

    const cancleOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(false);
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
                    <IconButton size="small" onClick={() => saveOverrideName()}>
                        <DoneIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => cancleOverrideName()}
                    >
                        <ClearIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => removeOverrideName()}
                    >
                        <DeleteIcon />
                    </IconButton>
                </>
            ) : (
                <div
                    id={source}
                    onMouseEnter={() => {
                        setDisplayEditIcon(true);
                    }}
                    onMouseLeave={() => setDisplayEditIcon(false)}
                >
                    <Tooltip title={title} placement="bottom">
                        <div>
                            <Button
                                size="small"
                                onClick={() => setDisplayRenameField(true)}
                                endIcon={
                                    displayEditIcon ? <CreateIcon /> : null
                                }
                                style={{ textTransform: 'none' }}
                                variant={displayEditIcon ? 'contained' : 'text'}
                                color={displayEditIcon ? 'primary' : 'default'}
                            >
                                {getName()}
                            </Button>
                        </div>
                    </Tooltip>
                </div>
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
    getLabelByLenght,
    title,
    ioKey,
    ...props
}) => {
    const [displayRenameField, setDisplayRenameField] = useState(false);
    const [displayEditIcon, setDisplayEditIcon] = useState(false);
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

    const getChannelName = () => {
        return has(personalNames, `${ioKey}.${source}.channels.${channelIndex}`)
            ? getLabelByLenght(
                  get(
                      personalNames,
                      `${ioKey}.${source}.channels.${channelIndex}`
                  )
              )
            : getLabelByLenght(defaultValue);
    };

    const removeOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(false);
        setValue(defaultValue);
        setPersonalNames(f => {
            let newpersonalNames = { ...f };
            if (
                has(
                    newpersonalNames,
                    `${ioKey}.${source}.channels.${channelIndex}`
                )
            ) {
                delete newpersonalNames[ioKey][source]['channels'][
                    channelIndex
                ];
            }
            if (
                isEmpty(get(newpersonalNames, `${ioKey}.${source}.channels`)) &&
                get(newpersonalNames, `${ioKey}.${source}.name`) === ''
            ) {
                delete newpersonalNames[ioKey][source];
            }
            return newpersonalNames;
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
        setDisplayEditIcon(false);
    };

    const cancleOverrideName = () => {
        setDisplayRenameField(false);
        setDisplayEditIcon(false);
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
                    <IconButton
                        size="small"
                        onClick={() => removeOverrideName()}
                    >
                        <DeleteIcon />
                    </IconButton>
                </>
            ) : (
                <div
                    id={source}
                    onMouseEnter={() => {
                        setDisplayEditIcon(true);
                    }}
                    onMouseLeave={() => setDisplayEditIcon(false)}
                >
                    <Tooltip title={title} placement="bottom">
                        <div>
                            <Button
                                size="small"
                                onClick={() => setDisplayRenameField(true)}
                                endIcon={
                                    displayEditIcon ? <CreateIcon /> : null
                                }
                                style={{ textTransform: 'none' }}
                                variant={displayEditIcon ? 'contained' : 'text'}
                                color={displayEditIcon ? 'primary' : 'default'}
                            >
                                {getChannelName()}
                            </Button>
                        </div>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};
