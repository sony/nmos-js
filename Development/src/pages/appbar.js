import React from 'react';
import { AppBar } from 'react-admin';
import { IconButton, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import { ThemeContext } from '../theme/ThemeContext';
import { useTheme } from '@material-ui/styles';

const styles = {
    title: {
        flex: 1,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
    spacer: {
        flex: 1,
    },
};

const CustomAppBar = withStyles(styles)(({ classes, ...props }) => {
    const theme = useTheme();
    let toggleThemeIcon;
    if (theme.palette.type === 'dark') {
        toggleThemeIcon = <Brightness7Icon />;
    } else {
        toggleThemeIcon = <Brightness4Icon />;
    }
    return (
        <AppBar {...props}>
            <Typography
                variant="title"
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
});

export default CustomAppBar;
