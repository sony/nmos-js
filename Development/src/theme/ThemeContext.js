import React from 'react';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import { blue, lightBlue } from '@material-ui/core/colors';
import { disabledSetting, useJSONSetting } from '../settings';

export const ThemeContext = React.createContext({
    theme: 'light',
    toggleTheme: () => {},
});

export const AppThemeProvider = ({ children }) => {
    const [themeState, setThemeState] = useJSONSetting('theme', {
        type: 'light',
    });

    const theme = responsiveFontSizes(
        createMuiTheme({
            palette: {
                primary: lightBlue,
                secondary: blue,
                type: themeState.type,
            },
            sidebar: {
                width: 240,
                closedWidth: 72,
            },
            overrides: {
                MuiTableCell: {
                    sizeSmall: {
                        '&:last-child': {
                            paddingRight: null,
                        },
                    },
                },
                RaReferenceField: {
                    link: {
                        color: null,
                        textDecoration: null,
                    },
                },
            },
        })
    );

    const toggleTheme = () => {
        if (disabledSetting('theme')) return;
        const toggledType = themeState.type === 'light' ? 'dark' : 'light';
        setThemeState({ type: toggledType });
    };

    return (
        <ThemeContext.Provider value={{ theme: themeState.type, toggleTheme }}>
            <ThemeProvider theme={theme}>
                {React.cloneElement(children, { theme })}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
