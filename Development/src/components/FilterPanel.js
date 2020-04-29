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
    source,
    label,
    filter,
    setFilter,
    autoFocus,
}) => {
    const [checked, setChecked] = useState(!!filter[source]);
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
    source,
    label,
    filter,
    setFilter,
    autoFocus,
    ...props
}) => {
    const [value, setValue] = useState(filter[source] ? filter[source] : '');
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
    source,
    label,
    filter,
    setFilter,
    autoFocus,
    ...props
}) => {
    const [value, setValue] = useState(filter[source] ? filter[source] : '');
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
    source,
    label,
    filter,
    setFilter,
    autoFocus,
    ...props
}) => {
    const [numeratorValue, setNumeratorValue] = useState(
        filter[source] ? filter[source].numerator : 0
    );
    const [denominatorValue, setDenominatorValue] = useState(
        filter[source] ? filter[source].denominator : 1
    );
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
                numerator: parseInt(numeratorValue, 10),
                denominator: parseInt(denominatorValue, 10),
            },
        }));
        return function cleanup() {
            setFilter(f => {
                let newFilter = { ...f };
                delete newFilter[source];
                return newFilter;
            });
        };
    }, [numeratorValue, denominatorValue, setFilter, source]);
    return (
        <Fragment>
            <TextField
                type="number"
                label={label + ' Numerator'}
                variant="filled"
                margin="dense"
                value={numeratorValue}
                onChange={event => setNumeratorValue(event.target.value)}
                inputRef={inputRef}
                {...props}
            />
            <TextField
                type="number"
                label={label + ' Denominator'}
                variant="filled"
                margin="dense"
                value={denominatorValue}
                onChange={event => setDenominatorValue(event.target.value)}
                inputRef={inputRef}
                {...props}
            />
        </Fragment>
    );
};

const FilterPanel = ({ children, filter, setFilter }) => {
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
                {React.Children.toArray(children).map(child => (
                    <MenuItem onClick={() => addFilter(child, true)}>
                        {get(child, 'props.label')
                            ? get(child, 'props.label')
                            : titleCase(get(child, 'props.source'))}
                    </MenuItem>
                ))}
                <Divider />
                <MenuItem
                    onClick={() => {
                        React.Children.toArray(children).map(child =>
                            addFilter(child)
                        );
                    }}
                >
                    All
                </MenuItem>
            </Menu>
        </div>
    );
};

export default FilterPanel;
