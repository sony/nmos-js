import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppBar, useRefresh, useVersion } from 'react-admin';
import {
    Button,
    ClickAwayListener,
    Grow,
    IconButton,
    LinearProgress,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Typography,
    withStyles,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import { ThemeContext } from '../theme/ThemeContext';
import { useTheme } from '@material-ui/styles';

const useStyles = makeStyles({
    title: {
        flex: 1,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
    spacer: {
        flex: 1,
    },
});

const ThemedLinearProgress = withStyles(theme => ({
    bar: {
        transition: 'none',
    },
    colorPrimary: {
        backgroundColor: theme.palette.secondary.dark,
    },
    barColorPrimary: {
        backgroundColor: theme.palette.secondary.light,
    },
}))(LinearProgress);

const intervals = [
    ['Off', null],
    ['5s', 5000],
    ['15s', 15000],
    ['30s', 30000],
    ['1m', 60000],
    ['5m', 300000],
    ['15m', 900000],
    ['30m', 1800000],
    ['1h', 3600000],
];

const useInterval = (callback, delay) => {
    const callbackFunction = useRef();
    useEffect(() => {
        callbackFunction.current = callback;
    }, [callback]);
    useEffect(() => {
        const tick = () => {
            callbackFunction.current();
        };
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

const RefreshSelector = () => {
    const [open, setOpen] = useState(false);
    const [percentage, setPercentage] = useState(0);
    const anchorRef = useRef(null);
    const [intervalsIndex, setIntervalsIndex] = React.useState(
        window.localStorage.getItem('refresh time') || 4
    );
    const refresh = useRefresh();
    const version = useVersion();
    const location = useLocation();
    useEffect(() => {
        setPercentage(0);
    }, [location]);
    const disable = (() => {
        const url = location.pathname.split('/');
        // #/{resourceType} is a list view
        // #/{resourceType}/create is (obviously enough) a create view
        // #/{resourceType}/{resourceId} is (somewhat surprisingly) an edit view
        // #/{resourceType}/{resourceId}/show is the show view (this arrangement is react-admin historical baggage)
        if (url.length === 3) return true;
        // #/settings is our custom Settings edit view
        return url.pop().toLowerCase() === 'settings';
    })();

    useInterval(
        () => {
            if (!disable) setPercentage(p => p + 1);
        },
        intervals[intervalsIndex][1] ? intervals[intervalsIndex][1] / 100 : null
    );

    useEffect(() => {
        if (percentage === 100) {
            refresh();
            setPercentage(0);
        }
    }, [percentage, refresh]);

    useEffect(() => {
        setPercentage(0);
    }, [version]);

    const handleMenuItemClick = (event, index) => {
        setIntervalsIndex(index);
        setOpen(false);
        setPercentage(0);
        window.localStorage.setItem('refresh time', index);
    };
    const handleToggle = () => {
        setOpen(prevOpen => !prevOpen);
    };
    const handleClose = event => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    return (
        <>
            {' '}
            {intervals[intervalsIndex][1] ? (
                <div ref={anchorRef}>
                    <Button
                        color="inherit"
                        size="small"
                        style={{ textTransform: 'none' }}
                        onClick={handleToggle}
                        disabled={disable}
                    >
                        <ArrowDropDownIcon size="small" />
                        {intervals[intervalsIndex][0]}
                    </Button>
                    <ThemedLinearProgress
                        variant="determinate"
                        value={percentage}
                    />
                </div>
            ) : (
                <IconButton
                    color="inherit"
                    size="small"
                    onClick={handleToggle}
                    disabled={disable}
                    ref={anchorRef}
                >
                    <ArrowDropDownIcon size="small" />
                </IconButton>
            )}
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom'
                                    ? 'center top'
                                    : 'center bottom',
                        }}
                    >
                        <Paper elevation={8}>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu">
                                    {intervals.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            selected={index === intervalsIndex}
                                            onClick={event =>
                                                handleMenuItemClick(
                                                    event,
                                                    index
                                                )
                                            }
                                            style={{ fontSize: '0.875rem' }}
                                        >
                                            {option[0]}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
};

const CustomAppBar = ({ ...props }) => {
    const classes = useStyles();
    const theme = useTheme();
    let toggleThemeIcon;
    if (theme.palette.type === 'dark') {
        toggleThemeIcon = <Brightness7Icon />;
    } else {
        toggleThemeIcon = <Brightness4Icon />;
    }
    return (
        <AppBar userMenu={<RefreshSelector />} {...props}>
            <Typography
                variant="h6"
                color="inherit"
                className={classes.title}
                id="react-admin-title"
            />
            <span className={classes.spacer} />
            <ThemeContext.Consumer>
                {({ toggleTheme }) => (
                    <IconButton color="inherit" onClick={toggleTheme}>
                        {toggleThemeIcon}
                    </IconButton>
                )}
            </ThemeContext.Consumer>
        </AppBar>
    );
};

export default CustomAppBar;
