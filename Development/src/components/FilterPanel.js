import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
    Button,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TextField,
    Typography,
    withStyles,
} from '@material-ui/core';
import get from 'lodash/get';

import ClearIcon from '@material-ui/icons/Clear';
import FilterListIcon from '@material-ui/icons/FilterList';

const titleCase = string => {
    return string.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const StyledTableCell = withStyles({
    root: {
        borderBottom: 'none',
    },
})(TableCell);

export const BooleanFilter = ({
    defaultValue,
    source,
    label,
    filter,
    setFilter,
    autoFocus,
}) => {
    const [checked, setChecked] = useState(() => {
        if (filter[source] != null) {
            return !!filter[source];
        } else if (defaultValue != null) {
            return defaultValue;
        } else {
            return false;
        }
    });
    if (!label) label = titleCase(source);

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus) inputRef.current.focus();
        }, 100);
        return () => {
            clearTimeout(timeout);
        };
    }, [autoFocus]);

    useEffect(() => {
        setFilter(f => ({ ...f, [source]: checked }));
        return function cleanup() {
            setFilter(f => {
                let newFilter = { ...f };
                delete newFilter[source];
                return newFilter;
            });
        };
    }, [checked, setFilter, source]);
    return (
        <div style={{ display: 'flex' }}>
            <Typography style={{ alignSelf: 'center' }}>{label}</Typography>
            <Switch
                checked={checked}
                onChange={() => setChecked(!checked)}
                inputRef={inputRef}
            />
        </div>
    );
};

export const NumberFilter = ({
    defaultValue,
    source,
    label,
    filter,
    setFilter,
    autoFocus,
    ...props
}) => {
    const [value, setValue] = useState(() => {
        if (filter[source] != null) {
            return filter[source];
        } else if (defaultValue != null) {
            return defaultValue;
        } else {
            return '';
        }
    });
    if (!label) label = titleCase(source);

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus) inputRef.current.focus();
        }, 100);
        return () => {
            clearTimeout(timeout);
        };
    }, [autoFocus]);

    useEffect(() => {
        setFilter(f => ({ ...f, [source]: parseInt(value, 10) }));
        return function cleanup() {
            setFilter(f => {
                let newFilter = { ...f };
                delete newFilter[source];
                return newFilter;
            });
        };
    }, [value, setFilter, source]);
    return (
        <TextField
            type="number"
            label={label}
            variant="filled"
            margin="dense"
            value={value}
            onChange={event => setValue(event.target.value)}
            inputRef={inputRef}
            {...props}
        />
    );
};

export const StringFilter = ({
    defaultValue,
    source,
    label,
    filter,
    setFilter,
    autoFocus,
    ...props
}) => {
    const [value, setValue] = useState(() => {
        if (filter[source] != null) {
            return filter[source];
        } else if (defaultValue != null) {
            return defaultValue;
        } else {
            return '';
        }
    });
    if (!label) label = titleCase(source);

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus) inputRef.current.focus();
        }, 100);
        return () => {
            clearTimeout(timeout);
        };
    }, [autoFocus]);

    useEffect(() => {
        setFilter(f => ({ ...f, [source]: value }));
        return function cleanup() {
            setFilter(f => {
                let newFilter = { ...f };
                delete newFilter[source];
                return newFilter;
            });
        };
    }, [value, setFilter, source]);
    return (
        <TextField
            label={label}
            variant="filled"
            margin="dense"
            value={value}
            onChange={event => setValue(event.target.value)}
            inputRef={inputRef}
            {...props}
        />
    );
};

export const RateFilter = ({
    defaultValue,
    source,
    label,
    filter,
    setFilter,
    autoFocus,
    ...props
}) => {
    const [value, setValue] = useState(() => {
        if (filter[source] != null) {
            return {
                numerator: get(defaultValue, 'numerator'),
                denominator: get(defaultValue, 'denominator'),
            };
        } else if (defaultValue != null) {
            return {
                numerator: get(filter[source], 'numerator'),
                denominator: get(filter[source], 'denominator'),
            };
        } else {
            return {
                numerator: 0,
                denominator: 1,
            };
        }
    });
    if (!label) label = titleCase(source);

    const inputRef = useRef();
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (autoFocus) inputRef.current.focus();
        }, 100);
        return () => {
            clearTimeout(timeout);
        };
    }, [autoFocus]);

    useEffect(() => {
        setFilter(f => ({
            ...f,
            [source]: {
                numerator: parseInt(value.numerator, 10),
                denominator: parseInt(value.denominator, 10),
            },
        }));
        return function cleanup() {
            setFilter(f => {
                let newFilter = { ...f };
                delete newFilter[source];
                return newFilter;
            });
        };
    }, [value, setFilter, source]);
    return (
        <Fragment>
            <TextField
                type="number"
                label={label + ' Numerator'}
                variant="filled"
                margin="dense"
                value={value.numerator}
                onChange={event =>
                    setValue(v => ({ ...v, numerator: event.target.value }))
                }
                inputRef={inputRef}
                {...props}
            />
            <TextField
                type="number"
                label={label + ' Denominator'}
                variant="filled"
                margin="dense"
                value={value.denominator}
                onChange={event =>
                    setValue(v => ({ ...v, denominator: event.target.value }))
                }
                {...props}
            />
        </Fragment>
    );
};

const FilterPanel = ({ children, defaultFilter, filter, setFilter }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [displayedFilters, setDisplayedFilters] = useState({});
    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const addFilter = (child, autoFocus = false) => {
        handleClose();
        setDisplayedFilters(f => ({
            ...f,
            [get(child, 'props.source')]: React.cloneElement(child, {
                defaultValue: get(defaultFilter, get(child, 'props.source')),
                filter: filter,
                setFilter: setFilter,
                autoFocus,
            }),
        }));
    };

    const removeFilter = key => {
        setDisplayedFilters(f => {
            delete f[key];
            return { ...f };
        });
    };

    const open = Boolean(anchorEl);

    return (
        <div style={{ display: 'flex', width: '100%' }}>
            <Table style={{ display: 'inline', flex: 1 }}>
                <TableBody>
                    <TableRow>
                        {Object.keys(displayedFilters).map(key => (
                            <Fragment key={key}>
                                <StyledTableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => removeFilter(key)}
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                </StyledTableCell>
                                <StyledTableCell padding="none">
                                    {displayedFilters[key]}
                                </StyledTableCell>
                            </Fragment>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
            <Button
                size="small"
                onClick={handleClick}
                style={{
                    alignSelf: 'center',
                    marginRight: '32px',
                    whiteSpace: 'nowrap',
                }}
                startIcon={<FilterListIcon />}
            >
                Add Filter
            </Button>
            <Menu
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
            >
                {React.Children.map(children, child => {
                    if (child) {
                        return (
                            <MenuItem onClick={() => addFilter(child, true)}>
                                {get(child, 'props.label')
                                    ? get(child, 'props.label')
                                    : titleCase(get(child, 'props.source'))}
                            </MenuItem>
                        );
                    }
                })}
                <Divider />
                <MenuItem
                    onClick={() => {
                        React.Children.map(children, child => {
                            if (child) {
                                addFilter(child);
                            }
                        });
                    }}
                >
                    All
                </MenuItem>
            </Menu>
        </div>
    );
};

export default FilterPanel;
