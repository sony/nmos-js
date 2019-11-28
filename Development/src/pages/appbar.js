import React, { Fragment } from 'react';
import { AppBar } from 'react-admin';
import { IconButton, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
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
        <AppBar userMenu={<Fragment />} {...props}>
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
