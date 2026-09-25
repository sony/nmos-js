import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
    Button,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Switch,
    TextField,
    Typography,
    withStyles,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import ClearIcon from '@material-ui/icons/Clear';
import FilterListIcon from '@material-ui/icons/FilterList';

import labelize from './labelize';

const CompactTextField = React.forwardRef(
    ({ classes, InputLabelProps = {}, InputProps = {}, ...props }, ref) => (
        <TextField
            {...props}
            ref={ref}
            InputLabelProps={{
                ...InputLabelProps,
                classes: {
                    ...InputLabelProps.classes,
                    root: `${classes.label} ${
                        get(InputLabelProps, 'classes.root') || ''
                    }`,
                },
            }}
            InputProps={{
                ...InputProps,
                classes: {
                    ...InputProps.classes,
                    input: `${classes.input} ${
                        get(InputProps, 'classes.input') || ''
                    }`,
                },
            }}
        />
    )
);

// a filter should not shout louder than the list or matrix it filters
const FILTER_FONT_SIZE = 14;
const FILTER_INPUT_PADDING_TOP = 20;
const FILTER_INPUT_PADDING_BOTTOM = 4;
const FILTER_INPUT_PADDING_X = 12;

const FilterTextField = withStyles({
    input: {
        fontSize: FILTER_FONT_SIZE,
        paddingTop: FILTER_INPUT_PADDING_TOP,
        paddingBottom: FILTER_INPUT_PADDING_BOTTOM,
    },
    label: {
        fontSize: FILTER_FONT_SIZE,
    },
})(CompactTextField);

export const AllFilters = ({ label = 'All' }) => <Fragment />;

export const FilterMode = ({
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
            return 'and';
        }
    });
    if (!label) label = labelize(source);

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
        <FilterTextField
            label={label}
            color="primary"
            variant="filled"
            margin="dense"
            size="small"
            value={value}
            onChange={event => setValue(event.target.value)}
            onFocus={event => event.target.select()}
            inputRef={inputRef}
            select
            {...props}
        >
            <MenuItem value="and">Match All</MenuItem>
            <MenuItem value="or">Match Any</MenuItem>
        </FilterTextField>
    );
};

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
            return true;
        }
    });
    if (!label) label = labelize(source);

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
            <Typography variant="body2" style={{ alignSelf: 'center' }}>
                {label}
            </Typography>
            <Switch
                color="primary"
                size="small"
                checked={checked}
                onChange={() => setChecked(!checked)}
                inputRef={inputRef}
            />
        </div>
    );
};

// clearSource names another key this filter owns, such as the value it
// matches against, which is removed along with it
export const ConstFilter = ({
    label,
    source,
    clearSource,
    filter,
    setFilter,
}) => {
    if (!label) label = labelize(source);

    useEffect(() => {
        setFilter(f => ({
            ...f,
            [source]: f[source] !== undefined ? f[source] : null,
        }));
        return function cleanup() {
            setFilter(f => {
                let newFilter = { ...f };
                delete newFilter[source];
                if (clearSource) delete newFilter[clearSource];
                return newFilter;
            });
        };
    }, [clearSource, setFilter, source]);
    const value = get(filter, source);
    // the page sets this filter's value, so show it like the fields the user
    // can type in, or just name the filter when it has no value to show
    return value == null ? (
        <div style={{ display: 'flex' }}>
            <Typography variant="body2" style={{ alignSelf: 'center' }}>
                {label}
            </Typography>
        </div>
    ) : (
        <FilterTextField
            label={label}
            color="primary"
            variant="filled"
            margin="dense"
            size="small"
            value={value}
            // no underline, since there is nothing to type in
            InputProps={{ readOnly: true, disableUnderline: true }}
        />
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
    if (!label) label = labelize(source);

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
        <FilterTextField
            type="number"
            label={label}
            color="primary"
            variant="filled"
            margin="dense"
            size="small"
            value={value}
            onChange={event => setValue(event.target.value)}
            onFocus={event => event.target.select()}
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
    if (!label) label = labelize(source);

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
        <FilterTextField
            label={label}
            color="primary"
            variant="filled"
            margin="dense"
            size="small"
            value={value}
            onChange={event => setValue(event.target.value)}
            onFocus={event => event.target.select()}
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
                numerator: get(filter[source], 'numerator') || '',
                denominator: get(filter[source], 'denominator') || '',
            };
        } else if (defaultValue != null) {
            return {
                numerator: get(defaultValue, 'numerator') || '',
                denominator: get(defaultValue, 'denominator') || '',
            };
        } else {
            return {
                numerator: '',
                denominator: '',
            };
        }
    });
    if (!label) label = labelize(source);

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
        <>
            <FilterTextField
                type="number"
                label={label}
                helperText="Numerator"
                color="primary"
                variant="filled"
                margin="dense"
                size="small"
                value={value.numerator}
                onChange={event =>
                    setValue(v => ({ ...v, numerator: event.target.value }))
                }
                onFocus={event => event.target.select()}
                inputRef={inputRef}
                InputProps={{
                    inputProps: {
                        min: 0,
                    },
                }}
                {...props}
            />
            <FilterTextField
                type="number"
                helperText="Denominator"
                color="primary"
                variant="filled"
                margin="dense"
                size="small"
                value={value.denominator}
                onChange={event =>
                    setValue(v => ({ ...v, denominator: event.target.value }))
                }
                onFocus={event => event.target.select()}
                InputProps={{
                    inputProps: {
                        min: 1,
                    },
                }}
                {...props}
            />
        </>
    );
};

const StyledAutocomplete = withStyles({
    input: {
        width: '100% !important',
    },
    inputRoot: {
        // Autocomplete pads the input as well as the box around it, which
        // makes the field wider and its value lower than a filter the user
        // just types in; both rules have to be as specific as the ones they
        // replace
        '&[class*="MuiFilledInput-root"][class*="MuiFilledInput-marginDense"]':
            {
                paddingTop: FILTER_INPUT_PADDING_TOP,
                paddingBottom: FILTER_INPUT_PADDING_BOTTOM,
                paddingLeft: FILTER_INPUT_PADDING_X,
                '& $input': {
                    padding: 0,
                },
            },
    },
    option: {
        fontSize: FILTER_FONT_SIZE,
    },
})(Autocomplete);

export const AutocompleteFilter = ({
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
    if (!label) label = labelize(source);

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
        <StyledAutocomplete
            size="small"
            value={value}
            onInputChange={(event, value) => setValue(value)}
            renderInput={params => (
                <FilterTextField
                    {...params}
                    label={label}
                    color="primary"
                    variant="filled"
                    margin="dense"
                    size="small"
                    onFocus={event => event.target.select()}
                    inputRef={inputRef}
                />
            )}
            disableClearable
            {...props}
        />
    );
};

const FilterPanel = ({
    children,
    defaultFilter,
    filter,
    setFilter,
    filterButtonLabel = 'Filters',
    allFilters = true,
    noFilters = false,
}) => {
    const cloneFilter = (child, autoFocus = false) =>
        React.cloneElement(child, {
            defaultValue: get(defaultFilter, get(child, 'props.source')),
            filter: filter,
            setFilter: setFilter,
            autoFocus,
        });

    const [anchorEl, setAnchorEl] = useState(null);
    const [displayedFilters, setDisplayedFilters] = useState(
        React.Children.toArray(children).reduce((f, child) => {
            const source = get(child, 'props.source');
            const value = get(filter, source);
            if (value || [0, false, null].includes(value)) {
                f[source] = cloneFilter(child);
            }
            return f;
        }, {})
    );

    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const isFilter = child =>
        child &&
        child.type !== MenuItem &&
        child.type !== Divider &&
        child.type !== AllFilters;

    const addFilter = (child, autoFocus = false) => {
        handleClose();
        if (isFilter(child)) {
            setDisplayedFilters(f => ({
                ...f,
                [get(child, 'props.source')]: cloneFilter(child, autoFocus),
            }));
        }
    };

    const addMenuItem = child =>
        child &&
        (child.type === MenuItem ? (
            React.cloneElement(child, {
                onClick: () => {
                    handleClose();
                    const inheritedOnClick = get(child, 'props.onClick');
                    if (inheritedOnClick) {
                        inheritedOnClick();
                    }
                },
            })
        ) : child.type === Divider ? (
            child
        ) : child.type === AllFilters ? (
            <MenuItem
                onClick={() =>
                    React.Children.map(children, child => addFilter(child))
                }
            >
                {get(child, 'props.label') || 'All'}
            </MenuItem>
        ) : (
            <MenuItem onClick={() => addFilter(child, true)}>
                {get(child, 'props.label') ||
                    labelize(get(child, 'props.source'))}
            </MenuItem>
        ));

    const removeFilter = key => {
        setDisplayedFilters(f => {
            delete f[key];
            return { ...f };
        });
    };

    const clearFilters = () => {
        handleClose();
        setDisplayedFilters({});
        setFilter({});
    };

    // None is only a choice once this panel has a filter up
    const showNoFilters = noFilters && !isEmpty(displayedFilters);

    const open = Boolean(anchorEl);

    return (
        <div style={{ display: 'flex', width: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                {Object.keys(displayedFilters).map(key => (
                    <div
                        key={key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginRight: '16px',
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={() => removeFilter(key)}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                        {displayedFilters[key]}
                    </div>
                ))}
            </div>
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
                {filterButtonLabel}
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
                {React.Children.map(children, addMenuItem)}
                {(allFilters || showNoFilters) && <Divider />}
                {allFilters && addMenuItem(<AllFilters />)}
                {showNoFilters && (
                    <MenuItem onClick={clearFilters}>{'None'}</MenuItem>
                )}
            </Menu>
        </div>
    );
};

export default FilterPanel;
