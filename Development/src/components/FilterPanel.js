import React, { Fragment, useEffect, useState } from 'react';
import {
    Button,
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

export const StringFilter = ({
    source,
    label,
    filter,
    setFilter,
    ...props
}) => {
    const [value, setValue] = useState(filter[source] ? filter[source] : '');
    if (!label) label = titleCase(source);
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
            {...props}
        />
    );
};

export const BooleanFilter = ({ source, label, filter, setFilter }) => {
    const [checked, setChecked] = useState(!!filter[source]);
    if (!label) label = titleCase(source);
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
            <Switch checked={checked} onChange={() => setChecked(!checked)} />
        </div>
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

    const addFilter = child => {
        handleClose();
        setDisplayedFilters(f => ({
            ...f,
            [get(child, 'props.source')]: React.cloneElement(child, {
                filter: filter,
                setFilter: setFilter,
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
            <Table style={{ display: 'inline' }}>
                <TableBody>
                    <TableRow>
                        {Object.keys(displayedFilters).map(key => (
                            <Fragment key={key}>
                                <StyledTableCell padding="none">
                                    <IconButton
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
            <span style={{ flex: 1 }} />
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
                {React.Children.map(children, child => (
                    <MenuItem onClick={() => addFilter(child)}>
                        {get(child, 'props.label')
                            ? get(child, 'props.label')
                            : titleCase(get(child, 'props.source'))}
                    </MenuItem>
                ))}
                <MenuItem
                    onClick={() => {
                        React.Children.map(children, child => addFilter(child));
                    }}
                >
                    Show All
                </MenuItem>
            </Menu>
        </div>
    );
};

export default FilterPanel;
